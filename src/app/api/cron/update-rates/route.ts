import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Optional: Protect cron route using a secret header (Vercel standard)
    const authHeader = request.headers.get('authorization');
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Fetch latest exchange rates with base PKR
    const response = await fetch('https://open.er-api.com/v6/latest/PKR', {
      next: { revalidate: 0 } // don't cache this fetch
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rates: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.result !== 'success' || !data.rates) {
      throw new Error('Invalid response format from exchange rate API');
    }

    const rates = data.rates;
    const currenciesToTrack = ['USD', 'GBP', 'EUR', 'AUD', 'CAD', 'AED', 'SAR'];
    
    const upsertData = currenciesToTrack.map(code => ({
      currency_code: code,
      rate_from_pkr: rates[code],
      updated_at: new Date().toISOString()
    })).filter(r => r.rate_from_pkr != null);

    if (upsertData.length === 0) {
      throw new Error('No valid rates found for tracked currencies');
    }

    const supabase = createServiceClient();
    
    const { error } = await supabase
      .from('exchange_rates')
      .upsert(upsertData, { onConflict: 'currency_code' });

    if (error) {
      console.error('Supabase upsert error:', error);
      throw error;
    }

    return NextResponse.json({ success: true, updatedCount: upsertData.length });
  } catch (error: any) {
    console.error('Update rates cron failed:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
