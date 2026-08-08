import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const service = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  try {
    const { orderId, action } = await req.json();

    if (!orderId || !action) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    if (action === 'request') {
      const { error } = await service
        .from('orders')
        .update({ refund_status: 'requested' })
        .eq('id', orderId)
        .eq('status', 'paid');
      
      if (error) throw error;
      return NextResponse.json({ success: true, status: 'requested' });
    } 
    
    if (action === 'approve') {
      // Approve refund manually (merchant side)
      const { data: order, error: orderError } = await service
        .from('orders')
        .select('id, amount')
        .eq('id', orderId)
        .single();
        
      if (orderError) throw orderError;

      // Mark order as refunded
      await service
        .from('orders')
        .update({ refund_status: 'refunded', refund_amount: order.amount })
        .eq('id', orderId);

      // Mark attendee as cancelled
      await service
        .from('attendees')
        .update({ status: 'cancelled' })
        .eq('order_id', orderId);

      return NextResponse.json({ success: true, status: 'refunded' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Refund error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
