import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendTicketConfirmation } from '@/lib/email';
import crypto from 'crypto';

function secureCompare(a: string, b: string) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
}

async function handleCallback(request: NextRequest) {
  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const siteUrl = `${protocol}://${host}`;
  
  try {
    const searchParams = request.nextUrl.searchParams;
    let tracker = searchParams.get('tracker') || '';
    let sig = searchParams.get('sig') || '';
    let orderId = searchParams.get('order_id') || searchParams.get('reference') || '';

    if (request.method === 'POST') {
      try {
        const contentType = request.headers.get('content-type') || '';
        if (contentType.includes('application/x-www-form-urlencoded')) {
          const formData = await request.formData();
          tracker = tracker || (formData.get('tracker') as string) || '';
          sig = sig || (formData.get('sig') as string) || '';
          orderId = orderId || (formData.get('order_id') as string) || (formData.get('reference') as string) || '';
        } else if (contentType.includes('application/json')) {
          const body = await request.json();
          tracker = tracker || body.tracker || '';
          sig = sig || body.sig || '';
          orderId = orderId || body.order_id || body.reference || '';
        }
      } catch (e) {
        console.error('Failed to parse POST body in payment callback:', e);
      }
    }

    let isSignatureValid = false;
    let signatureError = '';

    if (tracker && sig && orderId) {
      const secret = process.env.SAFEPAY_V1_SECRET;
      if (!secret) {
        signatureError = 'Payment gateway secret key is not configured';
      } else {
        const computedSig = crypto.createHmac('sha256', secret).update(tracker).digest('hex');
        isSignatureValid = secureCompare(computedSig, sig);
        if (!isSignatureValid) {
          signatureError = 'Invalid payment signature verification failed';
        }
      }
    } else if (!orderId) {
      return NextResponse.redirect(`${siteUrl}?paymentError=Missing order ID`, { status: 303 });
    }

    const service = createServiceClient();

    // Fetch the order
    const { data: order, error: orderErr } = await service
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.redirect(`${siteUrl}?paymentError=Order record not found`, { status: 303 });
    }

    const { data: event } = await service.from('events').select('*').eq('id', order.event_id).single();
    const eventSlug = event?.slug || '';

    // If order was already paid, redirect to success page
    if (order.status === 'paid') {
      return NextResponse.redirect(`${siteUrl}/e/${eventSlug}/success?order=${order.id}`, { status: 303 });
    }

    if (!isSignatureValid) {
      if (signatureError) {
        return NextResponse.redirect(`${siteUrl}/e/${eventSlug}?paymentError=${encodeURIComponent(signatureError)}`, { status: 303 });
      }
      return NextResponse.redirect(`${siteUrl}/e/${eventSlug}?paymentError=Processing`, { status: 303 });
    }

    // Update order status to paid
    const { error: updateOrderErr } = await service
      .from('orders')
      .update({ status: 'paid' })
      .eq('id', orderId);

    if (updateOrderErr) {
      return NextResponse.redirect(`${siteUrl}/e/${eventSlug}?paymentError=Database update failed`, { status: 303 });
    }

    // Since the order is paid, we need to ensure the attendee record exists.
    // The webhook might have created it already.
    const { data: existingAttendee } = await service
      .from('attendees')
      .select('id')
      .eq('event_id', order.event_id)
      .eq('guest_email', order.guest_email)
      .limit(1)
      .single();

    let attendeeId = existingAttendee?.id;

    if (!attendeeId) {
      const { data: newAttendee, error: attendeeErr } = await service.from('attendees').insert({
        event_id: order.event_id,
        guest_name: order.guest_name,
        guest_email: order.guest_email,
        ticket_type_id: order.ticket_type_id,
        status: 'registered'
      }).select().single();

      if (attendeeErr) {
        console.error("Failed to generate attendee record after payment", attendeeErr);
      } else if (newAttendee) {
        attendeeId = newAttendee.id;
      }
    }

    if (attendeeId) {
      // Send the email confirmation using Resend
      if (event) {
        try {
          await sendTicketConfirmation({
            to: order.guest_email,
            guestName: order.guest_name,
            eventName: event.title,
            eventDate: event.date,
            eventTime: event.time || 'TBD',
            venueName: event.venue_name || 'TBD',
            venueAddress: event.venue_address || '',
            orderId: order.id,
            attendeeId: attendeeId,
          });
        } catch (emailErr) {
          console.error("Failed to send confirmation email:", emailErr);
          // We don't fail the checkout if the email fails
        }
      }
    }

    // Successful checkout: redirect browser to Success step on the public event page
    return NextResponse.redirect(`${siteUrl}/e/${eventSlug}/success?order=${order.id}`, { status: 303 });
  } catch (error) {
    console.error('Safepay payment callback exception:', error);
    return NextResponse.redirect(`${siteUrl}?paymentError=Internal error`, { status: 303 });
  }
}

export async function GET(request: NextRequest) {
  return handleCallback(request);
}

export async function POST(request: NextRequest) {
  return handleCallback(request);
}
