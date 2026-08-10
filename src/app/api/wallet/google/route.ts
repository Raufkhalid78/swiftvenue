import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import jwt from 'jsonwebtoken';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const { 
      GOOGLE_WALLET_ISSUER_ID, 
      GOOGLE_WALLET_CLASS_ID, 
      GOOGLE_SERVICE_ACCOUNT_EMAIL, 
      GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY 
    } = process.env;

    if (!GOOGLE_WALLET_ISSUER_ID || !GOOGLE_WALLET_CLASS_ID || !GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
      console.warn("Google Wallet credentials missing in environment variables.");
      return NextResponse.json(
        { error: 'Wallet pass generation requires Google Service Account Credentials.', mock: true }, 
        { status: 400 }
      );
    }

    // Handle escaped newlines in the private key if necessary
    const privateKey = GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n');

    const service = createServiceClient();

    // Fetch order and associated event
    const { data: order, error: orderErr } = await service
      .from('orders')
      .select('*, events(*)')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const objectId = `${GOOGLE_WALLET_ISSUER_ID}.${order.id}`;
    const fullClassId = GOOGLE_WALLET_CLASS_ID.includes('.') 
      ? GOOGLE_WALLET_CLASS_ID 
      : `${GOOGLE_WALLET_ISSUER_ID}.${GOOGLE_WALLET_CLASS_ID}`;

    const event = order.events as any;
    const eventTitle = event?.title || 'SwiftVenue Event';
    const eventDate = event?.date ? new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '';
    const venueName = event?.venue_name || '';

    // --- Update the class event name via REST API (so the ticket shows the real event name) ---
    try {
      // Build a short-lived service account JWT for the Google API
      const apiToken = jwt.sign(
        { iss: GOOGLE_SERVICE_ACCOUNT_EMAIL, scope: 'https://www.googleapis.com/auth/wallet_object.issuer', aud: 'https://oauth2.googleapis.com/token', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 },
        privateKey,
        { algorithm: 'RS256' }
      );

      // Exchange for an OAuth2 access token
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: apiToken }),
      });
      const tokenData = await tokenRes.json();

      if (tokenData.access_token) {
        // PATCH the class to update the event name
        await fetch(`https://walletobjects.googleapis.com/walletobjects/v1/eventTicketClass/${encodeURIComponent(fullClassId)}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${tokenData.access_token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventName: { defaultValue: { language: 'en-US', value: eventTitle } },
            reviewStatus: 'UNDER_REVIEW',
          }),
        });
      }
    } catch (classUpdateErr) {
      // Non-fatal — log and continue. The pass will still be generated.
      console.warn('Could not update Google Wallet class event name:', classUpdateErr);
    }

    // Build the text modules for event details on the ticket
    const textModulesData = [
      { header: 'Event', body: eventTitle, id: 'event_name' },
      ...(eventDate ? [{ header: 'Date', body: eventDate, id: 'event_date' }] : []),
      ...(venueName ? [{ header: 'Venue', body: venueName, id: 'event_venue' }] : []),
    ];

    // Define the EventTicketObject payload
    const eventTicketObject = {
      id: objectId,
      classId: fullClassId,
      state: 'ACTIVE',
      barcode: {
        type: 'QR_CODE',
        value: order.id,
        alternateText: order.id.split('-')[0]
      },
      ticketHolderName: order.guest_name || 'Attendee',
      ticketNumber: order.id.split('-')[0].toUpperCase(),
      textModulesData,
    };

    const claims = {
      iss: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      aud: 'google',
      typ: 'savetowallet',
      iat: Math.floor(Date.now() / 1000),
      origins: [
        'https://swiftvenuehq.com',
        'https://www.swiftvenuehq.com',
      ],
      payload: {
        eventTicketObjects: [eventTicketObject]
      }
    };

    // Sign the JWT
    const token = jwt.sign(claims, privateKey, { algorithm: 'RS256' });
    const saveUrl = `https://pay.google.com/gp/v/save/${token}`;

    return NextResponse.json({ url: saveUrl, token });

  } catch (err: any) {
    console.error("Error generating Google Wallet link:", err);
    return NextResponse.json({ error: 'Failed to generate pass' }, { status: 500 });
  }
}
