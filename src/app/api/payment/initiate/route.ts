import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, guestName, guestEmail, amount } = body;

    if (!eventId || !guestName || !guestEmail || amount === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const service = createServiceClient();

    // Verify the event exists and is published
    const { data: event, error: eventError } = await service
      .from('events')
      .select('id, title, status')
      .eq('id', eventId)
      .single();

    if (eventError || !event || event.status !== 'published') {
      return NextResponse.json({ error: 'Event not found or unavailable' }, { status: 404 });
    }

    // Create a pending order record for the attendee ticket purchase
    const { data: order, error: orderErr } = await service
      .from('orders')
      .insert({
        event_id: eventId,
        guest_name: guestName,
        guest_email: guestEmail,
        amount: amount,
        currency: 'PKR',
        status: 'pending',
      })
      .select()
      .single();

    if (orderErr || !order) {
      console.error('Failed to create pending order:', orderErr);
      return NextResponse.json({ error: 'Failed to initialize ticket purchase' }, { status: 500 });
    }

    // If the event is free (0 amount), we can just bypass Safepay entirely 
    // and process it directly as paid in the callback, but here we'll assume it's paid for demo purposes.
    if (amount <= 0) {
      // In a real app, handle free RSVP logic here directly without redirecting to safepay
    }

    // Initialize Safepay SDK
    const safepaySecret = process.env.SAFEPAY_V1_SECRET || process.env.SAFEPAY_SECRET_KEY;
    const safepayMerchantKey = process.env.SAFEPAY_API_KEY || process.env.SAFEPAY_MERCHANT_API_KEY;

    if (!safepaySecret || !safepayMerchantKey) {
      console.error("Safepay credentials are not configured in environment variables.");
      return NextResponse.json({ error: 'Payment gateway configuration error' }, { status: 500 });
    }

    const safepayFactory = require('@sfpy/node-core');
    const safepay = safepayFactory(safepaySecret, {
      authType: 'secret',
      host: process.env.SAFEPAY_ENVIRONMENT === 'sandbox' ? 'https://sandbox.api.getsafepay.com' : 'https://api.getsafepay.com',
    });

    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const siteUrl = `${protocol}://${host}`;

    // Create Safepay Session
    const sessionResponse = await safepay.payments.session.setup({
      merchant_api_key: safepayMerchantKey,
      intent: 'CYBERSOURCE',
      mode: 'payment',
      currency: 'PKR',
      amount: Math.round(amount * 100), // Lowest denomination (Paisa)
      metadata: {
        order_id: order.id,
      }
    });

    const trackerToken = sessionResponse.data?.tracker?.token || sessionResponse.data?.token || sessionResponse.tracker?.token;
    if (!trackerToken) {
      throw new Error(`Safepay failed to return a tracker token.`);
    }

    // Update order with the tracker token for webhook/callback reconciliation
    await service.from('orders').update({ tracker: trackerToken }).eq('id', order.id);

    // Create a short-lived auth token
    const passportResponse = await safepay.client.passport.create();
    const tbt = passportResponse.data;
    if (!tbt) {
      throw new Error(`Safepay failed to return an auth token.`);
    }

    // Generate Checkout URL
    const env = process.env.SAFEPAY_ENVIRONMENT === 'production' ? 'production' : 'sandbox';
    const checkoutUrl = safepay.checkout.createCheckoutUrl({
      env,
      tracker: trackerToken,
      tbt,
      cancel_url: `${siteUrl}/e/checkout-cancel`,
      redirect_url: `${siteUrl}/api/payment/callback`,
      source: 'hosted',
    });

    return NextResponse.json({
      orderId: order.id,
      checkoutUrl: checkoutUrl
    });
  } catch (error: any) {
    console.error('POST /api/payment/initiate error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
