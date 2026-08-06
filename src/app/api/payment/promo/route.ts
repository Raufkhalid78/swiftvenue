import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    }

    const service = createServiceClient()

    const { data: promo } = await service
      .from('referral_codes')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .single()
      
    if (promo && (promo.max_uses === null || promo.current_uses < promo.max_uses)) {
      return NextResponse.json({ valid: true, discountPercent: promo.discount_percent || 10 })
    } else {
      return NextResponse.json({ error: 'Invalid or expired promo code' }, { status: 400 })
    }
  } catch (error) {
    console.error('GET /api/payment/promo error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
