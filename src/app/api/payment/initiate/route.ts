import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, guestName, guestEmail, ticketTypeId, quantity = 1, promoCode } = body;

    if (!eventId || !guestName || !guestEmail || !ticketTypeId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const service = createServiceClient();

    // Verify the event exists and is published
    const { data: event, error: eventError } = await service
      .from('events')
      .select('id, title, status, user_id, date, time, venue_name, venue_address, profiles(plan)')
      .eq('id', eventId)
      .single();

    if (eventError || !event || event.status !== 'published') {
      return NextResponse.json({ error: 'Event not found or unavailable' }, { status: 404 });
    }

    // Verify the ticket type and get the actual price
    const { data: ticketType, error: ticketError } = await service
      .from('ticket_types')
      .select('id, price, currency, is_active')
      .eq('id', ticketTypeId)
      .eq('event_id', eventId)
      .single();

    if (ticketError || !ticketType || !ticketType.is_active) {
      return NextResponse.json({ error: 'Invalid or inactive ticket type' }, { status: 400 });
    }

    // Attempt to atomically reserve the ticket(s)
    const { data: reserved, error: reserveError } = await service
      .rpc('reserve_ticket', { 
        p_ticket_type_id: ticketTypeId, 
        p_qty: quantity 
      });

    if (reserveError || !reserved) {
      return NextResponse.json({ error: 'Tickets sold out or unavailable' }, { status: 409 });
    }

    // Calculate the real amount securely on the server
    let amount = Number(ticketType.price) * quantity;
    let discountAmount = 0;

    // Apply Promo Code if provided
    if (promoCode && amount > 0) {
      const { data: promo, error: promoErr } = await service
        .from('promo_codes')
        .select('*')
        .eq('event_id', eventId)
        .ilike('code', promoCode)
        .single();

      if (!promoErr && promo && promo.is_active) {
        // Basic validity checks
        const now = new Date();
        const validFrom = promo.valid_from ? new Date(promo.valid_from) : null;
        const validUntil = promo.valid_until ? new Date(promo.valid_until) : null;
        
        const isStarted = !validFrom || validFrom <= now;
        const isNotExpired = !validUntil || validUntil >= now;
        const hasUsesLeft = !promo.max_uses || promo.current_uses < promo.max_uses;

        if (isStarted && isNotExpired && hasUsesLeft) {
          if (promo.discount_type === 'percentage') {
            discountAmount = amount * (Number(promo.discount_amount) / 100);
          } else if (promo.discount_type === 'fixed') {
            discountAmount = Number(promo.discount_amount);
          }
          amount = Math.max(0, amount - discountAmount);
        }
      }
    }

    // Fetch the organizer's plan configuration
    const profiles = event.profiles as any;
    const organizerPlan = Array.isArray(profiles) ? profiles[0]?.plan : profiles?.plan;
    const { data: planConfig } = await service
      .from('plans')
      .select('fee_percent, fee_fixed')
      .eq('id', organizerPlan || 'free')
      .single();

    const platformFee = amount > 0
      ? (amount * (Number(planConfig?.fee_percent ?? 7) / 100)) + (Number(planConfig?.fee_fixed ?? 30) * quantity)
      : 0;

    const totalCharged = amount + platformFee;

    // Create a pending order record for the attendee ticket purchase
    const { data: order, error: orderErr } = await service
      .from('orders')
      .insert({
        event_id: eventId,
        guest_name: guestName,
        guest_email: guestEmail,
        amount: totalCharged,
        currency: ticketType.currency || 'PKR',
        status: 'pending',
        ticket_type_id: ticketTypeId,
        quantity: quantity,
        promo_code: promoCode || null,
        discount_amount: discountAmount,
        platform_fee_amount: platformFee,
        organizer_net_amount: amount
      })
      .select()
      .single();

    if (orderErr || !order) {
      console.error('Failed to create pending order:', orderErr);
      // Rollback reservation on failure
      await service.rpc('reserve_ticket', { p_ticket_type_id: ticketTypeId, p_qty: -quantity });
      return NextResponse.json({ error: 'Failed to initialize ticket purchase' }, { status: 500 });
    }

    // Free ticket — mark paid immediately, skip the payment gateway
    if (totalCharged <= 0) {
      await service.from('orders').update({ status: 'paid' }).eq('id', order.id);

      const attendeesToInsert = Array.from({ length: quantity }).map(() => ({
        event_id: eventId,
        guest_name: guestName,
        guest_email: guestEmail,
        ticket_type_id: ticketTypeId,
        status: 'registered',
        order_id: order.id
      }));
      const { data: insertedAttendees } = await service.from('attendees').insert(attendeesToInsert).select();
      const attendeeId = insertedAttendees?.[0]?.id;

      if (event) {
        try {
          const { sendTicketConfirmation } = require('@/lib/email');
          await sendTicketConfirmation({
            to: guestEmail,
            guestName,
            eventName: event.title,
            eventDate: event.date,
            eventTime: event.time || 'TBD',
            venueName: event.venue_name || 'TBD',
            venueAddress: event.venue_address || '',
            orderId: order.id,
            attendeeId: attendeeId,
          });
        } catch (e) {
          console.error('Free ticket email failed:', e);
        }
      }

      return NextResponse.json({ orderId: order.id, checkoutUrl: null, free: true });
    }

    // Initialize Safepay SDK
    try {
      const safepaySecret = process.env.SAFEPAY_V1_SECRET || process.env.SAFEPAY_SECRET_KEY;
      const safepayMerchantKey = process.env.SAFEPAY_API_KEY || process.env.SAFEPAY_MERCHANT_API_KEY;

      if (!safepaySecret || !safepayMerchantKey) {
        console.error("Safepay credentials are not configured in environment variables.");
        throw new Error('Payment gateway configuration error');
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
        currency: ticketType.currency || 'PKR',
        amount: Math.round(totalCharged * 100), // Lowest denomination (Paisa)
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
    } catch (err: any) {
      await service.rpc('reserve_ticket', { p_ticket_type_id: ticketTypeId, p_qty: -quantity });
      console.error('Checkout initialization failed, reservation released:', err);
      return NextResponse.json({ error: 'Failed to initialize checkout' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('POST /api/payment/initiate error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
