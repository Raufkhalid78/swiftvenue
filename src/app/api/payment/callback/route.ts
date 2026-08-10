import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';



async function handleCallback(request: NextRequest) {
  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const siteUrl = `${protocol}://${host}`;
  
  try {
    const searchParams = request.nextUrl.searchParams;
    let orderId = searchParams.get('order_id') || searchParams.get('reference') || '';
    let tracker = searchParams.get('tracker') || '';

    if (request.method === 'POST') {
      try {
        const contentType = request.headers.get('content-type') || '';
        if (contentType.includes('application/x-www-form-urlencoded')) {
          const formData = await request.formData();
          orderId = orderId || (formData.get('order_id') as string) || (formData.get('reference') as string) || '';
          tracker = tracker || (formData.get('tracker') as string) || '';
        } else if (contentType.includes('application/json')) {
          const body = await request.json();
          orderId = orderId || body.order_id || body.reference || '';
          tracker = tracker || body.tracker || '';
        }
      } catch (e) {
        console.error('Failed to parse POST body in payment callback:', e);
      }
    }

    if (!orderId && !tracker) {
      return NextResponse.redirect(`${siteUrl}?paymentError=Missing order identification`, { status: 303 });
    }

    const service = createServiceClient();

    // Fetch the order event slug first
    let query = service.from('orders').select('id, event_id, status');
    if (tracker) {
      query = query.eq('tracker', tracker);
    } else {
      query = query.eq('id', orderId);
    }

    const { data: initialOrder } = await query.single();

    if (!initialOrder) {
      return NextResponse.redirect(`${siteUrl}?paymentError=Order record not found`, { status: 303 });
    }

    // Always use the real UUID orderId from the database from now on
    orderId = initialOrder.id;

    const { data: event } = await service.from('events').select('slug').eq('id', initialOrder.event_id).single();
    const eventSlug = event?.slug || '';

    // If order was already paid/failed (maybe by webhook), redirect immediately
    if (initialOrder.status === 'paid') {
      return NextResponse.redirect(`${siteUrl}/e/${eventSlug}/success?order=${orderId}`, { status: 303 });
    }
    if (initialOrder.status === 'failed') {
      return NextResponse.redirect(`${siteUrl}/e/${eventSlug}?paymentError=Payment failed`, { status: 303 });
    }

    // Otherwise, poll for up to 3 seconds to see if the webhook finishes it
    let finalOrder: any = null;
    for (let attempt = 0; attempt < 6; attempt++) {
      const { data } = await service.from('orders').select('status').eq('id', orderId).single();
      if (data?.status === 'paid' || data?.status === 'failed') { 
        finalOrder = data; 
        break; 
      }
      await new Promise(r => setTimeout(r, 500));
    }

    if (finalOrder?.status === 'paid') {
      return NextResponse.redirect(`${siteUrl}/e/${eventSlug}/success?order=${orderId}`, { status: 303 });
    } else if (finalOrder?.status === 'failed') {
      return NextResponse.redirect(`${siteUrl}/e/${eventSlug}?paymentError=Payment failed`, { status: 303 });
    } else {
      // Still pending — the webhook hasn't processed it yet, redirect to the polling confirming page
      return NextResponse.redirect(`${siteUrl}/e/${eventSlug}/confirming?order=${orderId}`, { status: 303 });
    }

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
