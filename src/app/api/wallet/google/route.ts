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
      console.warn("Google Wallet credentials missing in environment variables. Falling back to stub error response.");
      return NextResponse.json(
        { 
          error: 'Wallet pass generation requires Google Service Account Credentials. See the Wallet Setup Guide.',
          mock: true
        }, 
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

    // Define the EventTicketObject payload
    const eventTicketObject = {
      id: objectId,
      classId: GOOGLE_WALLET_CLASS_ID,
      state: 'ACTIVE',
      barcode: {
        type: 'QR_CODE',
        value: order.id,
        alternateText: order.id.split('-')[0]
      },
      ticketHolderName: order.guest_name || 'Attendee',
      ticketNumber: order.id.split('-')[0].toUpperCase(),
      seatInfo: {
        seat: {
          defaultValue: {
            language: 'en-US',
            value: 'General Admission'
          }
        }
      }
    };

    const claims = {
      iss: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      aud: 'google',
      typ: 'savetowallet',
      iat: Math.floor(Date.now() / 1000),
      payload: {
        eventTicketObjects: [eventTicketObject]
      }
    };

    // Sign the JWT
    const token = jwt.sign(claims, privateKey, { algorithm: 'RS256' });

    // The frontend should open this URL or redirect to it
    const saveUrl = `https://pay.google.com/gp/v/save/${token}`;

    return NextResponse.json({ url: saveUrl });

  } catch (err: any) {
    console.error("Error generating Google Wallet link:", err);
    return NextResponse.json({ error: 'Failed to generate pass' }, { status: 500 });
  }
}
