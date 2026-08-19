import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_mock_key");

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: attendeeId } = await params;
    const { recipientEmail, recipientName, purchaserEmail } = await request.json();

    if (!attendeeId || !recipientEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const service = createServiceClient();

    // Fetch attendee
    const { data: attendee, error: fetchErr } = await service
      .from("attendees")
      .select("*, events(title, date, time, venue_name, slug), ticket_types(name)")
      .eq("id", attendeeId)
      .single();

    if (fetchErr || !attendee) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    if (attendee.status === "attended") {
      return NextResponse.json({ error: "Cannot transfer an already checked-in ticket" }, { status: 400 });
    }

    // Generate claim token if not existing
    const claimToken = attendee.claim_token || crypto.randomUUID();
    const originalPurchaser = attendee.original_purchaser_email || purchaserEmail || attendee.guest_email;

    const { error: updateErr } = await service
      .from("attendees")
      .update({
        claim_token: claimToken,
        original_purchaser_email: originalPurchaser,
      })
      .eq("id", attendeeId);

    if (updateErr) {
      console.error("Failed to update claim token:", updateErr);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const host = request.headers.get("host") || "swiftvenuehq.com";
    const protocol = host.includes("localhost") ? "http" : "https";
    const claimUrl = `${protocol}://${host}/claim/${claimToken}`;

    const event = Array.isArray(attendee.events) ? attendee.events[0] : attendee.events;
    const ticketTier = Array.isArray(attendee.ticket_types) ? attendee.ticket_types[0]?.name : attendee.ticket_types?.name || "General Admission";

    // Send transfer email to recipient
    if (process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: `SwiftVenue Tickets <tickets@swiftvenuehq.com>`,
          to: recipientEmail,
          subject: `You've been sent a ticket to ${event?.title || 'an event'}!`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #ffffff; color: #1e293b;">
              <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="font-size: 24px; font-weight: 800; color: #0f172a; margin: 0;">You've received a ticket!</h1>
                <p style="color: #64748b; font-size: 15px; margin-top: 8px;">Hi ${recipientName || 'there'}, ${originalPurchaser} has transferred a ticket to you for <strong>${event?.title}</strong>.</p>
              </div>

              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;">
                <p style="margin: 4px 0; font-size: 14px; color: #64748b;">Event: <strong style="color: #0f172a;">${event?.title}</strong></p>
                <p style="margin: 4px 0; font-size: 14px; color: #64748b;">Ticket Tier: <strong style="color: #0f172a;">${ticketTier}</strong></p>
                <p style="margin: 4px 0; font-size: 14px; color: #64748b;">Date: <strong style="color: #0f172a;">${event?.date} ${event?.time ? `at ${event?.time}` : ''}</strong></p>
                <p style="margin: 4px 0; font-size: 14px; color: #64748b;">Venue: <strong style="color: #0f172a;">${event?.venue_name}</strong></p>
              </div>

              <div style="text-align: center; margin: 32px 0;">
                <a href="${claimUrl}" style="display: inline-block; background: #0f172a; color: #ffffff; padding: 14px 32px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 15px;">
                  Claim Your Ticket
                </a>
              </div>

              <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 32px;">
                If you were not expecting this, you can safely ignore this email.
              </p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error("Failed to send transfer email:", emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      claimUrl,
      claimToken,
    });
  } catch (error: any) {
    console.error("POST /api/attendees/[id]/transfer error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
