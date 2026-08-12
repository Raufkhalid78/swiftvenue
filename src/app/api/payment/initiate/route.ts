import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, createClient } from '@/lib/supabase/server';
import { calculatePlatformFee } from '@/lib/fees';
import { checkGuestLimit } from '@/lib/plans';
import { createReferralCode } from '@/lib/referral';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, guestName, guestEmail, guestPhone, ticketTypeId, quantity = 1, promoCode, attendeeDetails, seatIds } = body;

    if (!eventId || !guestName || !guestEmail || !ticketTypeId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createClient();
    const service = createServiceClient();

    // Verify the event exists
    const { data: event, error: eventError } = await service
      .from('events')
      .select('id, title, slug, status, user_id, date, time, venue_name, venue_address')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      console.error("Event fetch error:", eventError);
      return NextResponse.json({ error: `Event fetch failed: ${eventError?.message || 'Not found'}` }, { status: 404 });
    }

    if (event.status !== 'published') {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (!user || user.id !== event.user_id) {
        console.error("Auth error or user mismatch:", { authError, userId: user?.id, eventUserId: event.user_id });
        return NextResponse.json({ error: 'Auth failed for draft event checkout' }, { status: 403 });
      }
    }

    // Verify the ticket type and get the actual price
    const { data: ticketType, error: ticketError } = await service
      .from('ticket_types')
      .select('id, name, price, currency, is_active')
      .eq('id', ticketTypeId)
      .eq('event_id', eventId)
      .single();

    if (ticketError || !ticketType || !ticketType.is_active) {
      return NextResponse.json({ error: 'Invalid or inactive ticket type' }, { status: 400 });
    }

    // Extract organizer plan earlier for guest limit check
    const { data: organizerProfile } = await service.from('profiles').select('plan').eq('id', event.user_id).single();
    const organizerPlan = organizerProfile?.plan || 'basic';

    // Check plan guest limits before reserving tickets
    const limitResponse = await checkGuestLimit(service, eventId, organizerPlan || 'free', quantity);
    if (limitResponse) return limitResponse;

    // Attempt to atomically reserve the ticket(s)
    const { data: reserved, error: reserveError } = await service
      .rpc('reserve_ticket', { 
        p_ticket_type_id: ticketTypeId, 
        p_qty: quantity 
      });

    if (reserveError || !reserved) {
      return NextResponse.json({ error: 'Tickets sold out or unavailable' }, { status: 409 });
    }

    // Handle Seat Locking
    const sessionId = crypto.randomUUID();
    let lockedSeats: string[] = [];
    if (seatIds && Array.isArray(seatIds) && seatIds.length > 0) {
      for (const seatId of seatIds) {
        const { data: locked } = await service.rpc('lock_seat', { p_seat_id: seatId, p_session_id: sessionId });
        if (locked) {
          lockedSeats.push(seatId);
        } else {
          // Rollback locks
          if (lockedSeats.length > 0) {
            await service.from('seats').update({ status: 'available', locked_by_session: null, locked_until: null }).in('id', lockedSeats);
          }
          await service.rpc('reserve_ticket', { p_ticket_type_id: ticketTypeId, p_qty: -quantity });
          return NextResponse.json({ error: 'One or more selected seats are no longer available. Please select different seats.' }, { status: 409 });
        }
      }
    }

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

    // Fetch the organizer's plan configuration (plan ID was extracted above)
    const { data: planConfig } = await service
      .from('plans')
      .select('fee_percent, fee_fixed')
      .eq('id', organizerPlan || 'free')
      .single();

    const platformFee = calculatePlatformFee(amount, quantity, planConfig);

    const totalCharged = amount + platformFee;

    // Create a pending order record for the attendee ticket purchase
    const { data: order, error: orderErr } = await service
      .from('orders')
      .insert({
        event_id: eventId,
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone || null,
        amount: totalCharged,
        currency: ticketType.currency || 'PKR',
        status: 'pending',
        ticket_type_id: ticketTypeId,
        quantity: quantity,
        promo_code: promoCode || null,
        discount_amount: discountAmount,
        platform_fee_amount: platformFee,
        organizer_net_amount: amount,
        metadata: { attendeeDetails: attendeeDetails || null, seatIds: seatIds || null, seatSessionId: sessionId }
      })
      .select()
      .single();

    if (orderErr || !order) {
      console.error('Failed to create pending order:', orderErr);
      // Rollback reservation on failure
      await service.rpc('reserve_ticket', { p_ticket_type_id: ticketTypeId, p_qty: -quantity });
      if (lockedSeats.length > 0) {
        await service.from('seats').update({ status: 'available', locked_by_session: null, locked_until: null }).in('id', lockedSeats);
      }
      
      const releasedEntryId = await service.rpc('notify_next_waitlist_entry', { p_ticket_type_id: ticketTypeId });
      if (releasedEntryId.data) {
        const { data: entry } = await service.from('waitlists').select('*').eq('id', releasedEntryId.data).single();
        if (entry && event) {
          try {
            const { sendWaitlistOffer } = require('@/lib/email');
            const host = request.headers.get('host') || 'localhost:3000';
            const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
            await sendWaitlistOffer({ 
              to: entry.guest_email, 
              guestName: entry.guest_name, 
              eventName: event.title,
              eventDate: event.date,
              eventTime: event.time || 'TBD',
              ticketName: ticketType.name || 'General Admission',
              checkoutUrl: `${protocol}://${host}/e/${event.slug}?ticket=${ticketTypeId}`,
              expiresAt: entry.offer_expires_at 
            });
          } catch (e) {
            console.error('Waitlist offer email failed:', e);
          }
        }
      }
      return NextResponse.json({ error: `Failed to initialize ticket purchase: ${orderErr?.message || 'Unknown error'}` }, { status: 500 });
    }

    // Generate referral code for this attendee (stored in promo_codes table)
    await createReferralCode(service, eventId, guestName, order.id);
    // Note: referral_code column does not exist on orders - code is in promo_codes table

    // Free ticket — mark paid immediately, skip the payment gateway
    if (totalCharged <= 0) {
      await service.from('orders').update({ status: 'paid' }).eq('id', order.id);

      const attendeesToInsert = Array.from({ length: quantity }).map((_, i) => ({
        event_id: eventId,
        guest_name: attendeeDetails && attendeeDetails[i]?.name ? attendeeDetails[i].name : guestName,
        guest_email: attendeeDetails && attendeeDetails[i]?.email ? attendeeDetails[i].email : guestEmail,
        guest_phone: guestPhone || null,
        ticket_type_id: ticketTypeId,
        status: 'registered',
        order_id: order.id,
        seat_id: seatIds ? seatIds[i] : null
      }));
      const { data: insertedAttendees } = await service.from('attendees').insert(attendeesToInsert).select();
      const attendeeId = insertedAttendees?.[0]?.id;

      if (seatIds && seatIds.length > 0) {
        await service.from('seats').update({ status: 'sold', order_id: order.id }).in('id', seatIds);
      }

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

          if (guestPhone) {
            const { sendTicketViaWhatsApp } = require('@/lib/whatsapp');
            const host = request.headers.get('host') || 'localhost:3000';
            const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
            await sendTicketViaWhatsApp(
              guestPhone,
              guestName,
              event.title,
              `${protocol}://${host}/e/preview-${order.id}`
            );
          }
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
      if (lockedSeats.length > 0) {
        await service.from('seats').update({ status: 'available', locked_by_session: null, locked_until: null }).in('id', lockedSeats);
      }
      const releasedEntryId = await service.rpc('notify_next_waitlist_entry', { p_ticket_type_id: ticketTypeId });
      if (releasedEntryId.data) {
        const { data: entry } = await service.from('waitlists').select('*').eq('id', releasedEntryId.data).single();
        if (entry && event) {
          try {
            const { sendWaitlistOffer } = require('@/lib/email');
            const host = request.headers.get('host') || 'localhost:3000';
            const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
            await sendWaitlistOffer({ 
              to: entry.guest_email, 
              guestName: entry.guest_name, 
              eventName: event.title,
              eventDate: event.date,
              eventTime: event.time || 'TBD',
              ticketName: ticketType.name || 'General Admission',
              checkoutUrl: `${protocol}://${host}/e/${event.slug}?ticket=${ticketTypeId}`,
              expiresAt: entry.offer_expires_at 
            });
          } catch (e) {
            console.error('Waitlist offer email failed:', e);
          }
        }
      }
      console.error('Checkout initialization failed, reservation released:', err);
      return NextResponse.json({ error: 'Failed to initialize checkout', details: err?.message || 'Unknown error' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('POST /api/payment/initiate error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
