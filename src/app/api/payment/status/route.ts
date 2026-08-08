import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tracker = request.nextUrl.searchParams.get('tracker')
    if (!tracker) {
      return NextResponse.json({ error: 'tracker is required' }, { status: 400 })
    }

    const service = createServiceClient()
    const { data: order, error } = await service
      .from('orders')
      .select('*')
      .eq('tracker', tracker)
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // If still pending, actively check with Safepay — self-heals if the webhook was missed or delayed
    if (order.status === 'pending') {
      try {
        const safepaySecret = process.env.SAFEPAY_V1_SECRET || process.env.SAFEPAY_SECRET_KEY
        const safepayFactory = require('@sfpy/node-core')
        const safepay = safepayFactory(safepaySecret, {
          authType: 'secret',
          host: process.env.SAFEPAY_HOST || (process.env.SAFEPAY_ENVIRONMENT === 'sandbox' ? 'https://sandbox.api.getsafepay.com' : 'https://api.getsafepay.com'),
        })

        const trackerResponse = await safepay.reporter.payments.fetch(tracker)
        const state = trackerResponse?.data?.tracker?.state

        if (state === 'TRACKER_ENDED') {
          await service.from('orders').update({ status: 'paid' }).eq('id', order.id)

          const invUpdate: Record<string, unknown> = { is_active: true, plan: order.plan }
          if (order.target_guest_links_quota > 0) {
            invUpdate.guest_links_quota = order.target_guest_links_quota
          }
          await service.from('invitations').update(invUpdate).eq('id', order.invitation_id)
          await service.from('profiles').update({ plan: order.plan }).eq('id', order.user_id)

          order.status = 'paid'
        }
      } catch (e) {
        console.error('Self-heal tracker check failed:', e)
        // fall through and report current DB state — don't fail the request
      }
    }

    return NextResponse.json({ status: order.status, invitationId: order.invitation_id })
  } catch (error) {
    console.error('GET /api/payment/status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
