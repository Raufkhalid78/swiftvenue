import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    
    // Webhook secret validation
    const secret = process.env.SAFEPAY_WEBHOOK_SECRET
    if (!secret) {
      console.error('SAFEPAY_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const payload = JSON.parse(rawBody)

    // Verify Webhook Signature using crypto (HMAC SHA-512)
    const sigHeader = request.headers.get('x-sfpy-signature') || ''
    const expectedSig = crypto.createHmac('sha512', secret).update(rawBody).digest('hex')
    const expectedSig256 = crypto.createHmac('sha256', secret).update(rawBody).digest('hex') // Legacy fallback

    let isValid = false
    if (sigHeader === expectedSig || sigHeader === expectedSig256) {
      isValid = true
    }

    if (!isValid) {
      console.warn("Invalid webhook signature")
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const service = createServiceClient()
    const eventData = payload.data || payload
    
    // Safely extract the event name/type
    const eventName = (payload.name || payload.type || payload.event || '').toLowerCase()

    const successEvents = ['payment.succeeded', 'payment:created']
    const failedEvents = ['payment.failed', 'payment:failed']

    if (!successEvents.includes(eventName) && !failedEvents.includes(eventName)) {
      console.log(`Webhook received unhandled event: ${eventName}. Ignoring.`)
      return NextResponse.json({ received: true, ignored: true, reason: 'Unhandled event' })
    }

    // Hosted checkout webhooks provide the tracker token
    const trackerToken = eventData.tracker?.token || eventData.tracker || payload.tracker || '';
    if (!trackerToken) {
      console.warn("Webhook payload missing tracker token")
      return NextResponse.json({ error: "Missing tracker" }, { status: 400 })
    }

    // Find the order by tracker token (added via our migration)
    const { data: order, error: orderErr } = await service
      .from('orders')
      .select('*')
      .eq('tracker', trackerToken)
      .single()

    if (orderErr || !order) {
      console.error("Order not found for webhook tracker:", trackerToken)
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

 if (order.status === 'paid') {
      return NextResponse.json({ received: true, status: 'already_paid' })
    }


    if (failedEvents.includes(eventName)) {
      // Just mark it as failed, but it can be retried, so be careful.
      // Usually we leave it as pending so user can retry, or mark it failed.
      await service.from('orders').update({ status: 'failed' }).eq('id', order.id);
      return NextResponse.json({ received: true, status: 'failed' })
    }

    // Verify payment amount matches order amount
    const paidAmount = eventData.purchase_totals?.base_amount?.amount || 
                       eventData.amount || 
                       eventData.notification?.amount;

    if (paidAmount !== undefined && paidAmount !== null) {
      // Handle potential denomination differences (e.g., amount in Paisa vs PKR)
      const numericPaid = Number(paidAmount);
      const isMatch = numericPaid === order.amount || numericPaid === order.amount * 100 || numericPaid === order.amount / 100;
      
      if (!isMatch) {
        console.error(`Security alert: Payment amount mismatch for order ${order.id}. Expected: ${order.amount}, Got: ${paidAmount}`);
        return NextResponse.json({ error: "Payment amount mismatch. Security verification failed." }, { status: 400 });
      }
    }

    // 1. Update order status
    const { error: updateOrderErr } = await service
      .from('orders')
      .update({ status: 'paid' })
      .eq('id', order.id)

    if (updateOrderErr) {
      console.error("Failed to update order in webhook:", updateOrderErr)
      return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
    }

    // 2. Update invitation status and quota (if a quota top-up was ordered)
    const invUpdate: Record<string, unknown> = { is_active: true, plan: order.plan }
    if (order.target_guest_links_quota > 0) {
      invUpdate.guest_links_quota = order.target_guest_links_quota
    }
    await service
      .from('invitations')
      .update(invUpdate)
      .eq('id', order.invitation_id)

    // 3. Update profile plan
    await service
      .from('profiles')
      .update({ plan: order.plan })
      .eq('id', order.user_id)
      
    // 4. Increment promo code usage and calculate affiliate commission if applied
    if (order.promo_code) {
      const { error: promoErr } = await service.rpc('increment_promo_usage', { code_val: order.promo_code });
      if (promoErr) {
        console.error('Failed to increment promo usage:', promoErr);
      }

      // Fetch referral code details to see if it belongs to an affiliate
      const { data: refCode } = await service
        .from('referral_codes')
        .select('user_id')
        .eq('code', order.promo_code)
        .single();

      if (refCode?.user_id) {
        // Calculate 10% commission of the final order amount
        const commissionAmount = order.amount * 0.10;
        const { error: commErr } = await service.from('affiliate_commissions').insert({
          affiliate_id: refCode.user_id,
          order_id: order.id,
          referral_code: order.promo_code,
          commission_amount: commissionAmount,
          status: 'pending'
        });
        if (commErr) console.error('Failed to save affiliate commission:', commErr);
      }
    }

    console.log("Safepay webhook successfully processed payment for order:", order.id)

    return NextResponse.json({ received: true, success: true })
  } catch (error) {
    console.error("Webhook processing error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
