import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { PKPass } from 'passkit-generator';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const attendeeId = searchParams.get('attendeeId');

    if (!attendeeId) {
      return NextResponse.json({ error: 'Attendee ID is required' }, { status: 400 });
    }

    const { 
      APPLE_WALLET_PASS_TYPE_IDENTIFIER, 
      APPLE_WALLET_TEAM_ID, 
      APPLE_WALLET_CERTIFICATE_PEM, 
      APPLE_WALLET_PRIVATE_KEY_PEM, 
      APPLE_WALLET_WWDR_CERTIFICATE 
    } = process.env;

    if (!APPLE_WALLET_PASS_TYPE_IDENTIFIER || !APPLE_WALLET_TEAM_ID || !APPLE_WALLET_CERTIFICATE_PEM || !APPLE_WALLET_PRIVATE_KEY_PEM || !APPLE_WALLET_WWDR_CERTIFICATE) {
      console.warn("Apple Wallet credentials missing in environment variables. Falling back to stub error response.");
      return NextResponse.json(
        { 
          error: 'Wallet pass generation requires Apple Developer Certificates. See the Wallet Setup Guide.',
          mock: true
        }, 
        { status: 400 }
      );
    }

    const service = createServiceClient();

    // Fetch attendee and associated event
    const { data: attendee, error: attendeeErr } = await service
      .from('attendees')
      .select('*, events(*)')
      .eq('id', attendeeId)
      .single();

    if (attendeeErr || !attendee) {
      return NextResponse.json({ error: 'Attendee not found' }, { status: 404 });
    }

    const event = Array.isArray(attendee.events) ? attendee.events[0] : attendee.events;

    // Build the Pass
    const pass = new PKPass({}, {
      signerCert: APPLE_WALLET_CERTIFICATE_PEM,
      signerKey: APPLE_WALLET_PRIVATE_KEY_PEM,
      wwdr: APPLE_WALLET_WWDR_CERTIFICATE,
    }, {
      passTypeIdentifier: APPLE_WALLET_PASS_TYPE_IDENTIFIER,
      teamIdentifier: APPLE_WALLET_TEAM_ID,
      organizationName: "SwiftVenue",
      description: `${event.title} Ticket`,
      backgroundColor: event.theme_color || "rgb(15, 23, 42)",
      foregroundColor: "rgb(255, 255, 255)",
      labelColor: "rgb(200, 200, 200)",
      logoText: "SwiftVenue",
    });

    pass.type = "eventTicket";

    pass.primaryFields.push({
      key: "event",
      label: "EVENT",
      value: event.title
    });

    pass.secondaryFields.push({
      key: "date",
      label: "DATE & TIME",
      value: `${event.date} ${event.time || ''}`.trim()
    });

    pass.auxiliaryFields.push({
      key: "venue",
      label: "VENUE",
      value: event.venue_name || "TBA"
    });

    pass.auxiliaryFields.push({
      key: "guest",
      label: "GUEST",
      value: attendee.guest_name || "Attendee"
    });

    pass.setBarcodes({
      format: "PKBarcodeFormatQR",
      message: attendee.id,
      messageEncoding: "iso-8859-1",
      altText: attendee.id.split('-')[0] // Short id for alt text
    });

    const buffer = await pass.getAsBuffer();

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': `attachment; filename="ticket-${attendee.id}.pkpass"`,
      },
    });

  } catch (err: any) {
    console.error("Error generating Apple Pass:", err);
    return NextResponse.json({ error: 'Failed to generate pass' }, { status: 500 });
  }
}
