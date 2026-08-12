import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import { checkEventAccess } from "@/lib/team";

const resend = new Resend(process.env.RESEND_API_KEY || "re_mock_key");

export async function POST(request: NextRequest) {
  try {
    const { eventId, subject, body } = await request.json();

    if (!eventId || !subject || !body) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const service = createServiceClient();

    // Fetch the event
    const { data: event, error: eventErr } = await service
      .from("events")
      .select("title, user_id, broadcast_count")
      .eq("id", eventId)
      .single();

    if (eventErr || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const hasAccess = await checkEventAccess(service, eventId, user.id, ['owner', 'coorganizer']);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden: You do not have permission to broadcast to this event's attendees" }, { status: 403 });
    }

    // Check plan limit
    const { data: profile } = await service.from('profiles').select('plan').eq('id', event.user_id).single();
    const { data: planConfig } = await service.from('plans').select('broadcast_limit').eq('id', profile?.plan || 'free').single();
    
    if (planConfig?.broadcast_limit !== null && planConfig?.broadcast_limit !== undefined) {
      if ((event.broadcast_count || 0) >= planConfig.broadcast_limit) {
        return NextResponse.json(
          { error: `Broadcast limit reached. You can only send ${planConfig.broadcast_limit} broadcast(s) per event on your current plan.` },
          { status: 403 }
        );
      }
    }

    // Fetch all attendees for this event
    const { data: attendees, error: attendeesErr } = await service
      .from("attendees")
      .select("guest_email")
      .eq("event_id", eventId)
      .neq("status", "cancelled");

    if (attendeesErr) {
      return NextResponse.json({ error: "Failed to fetch attendees" }, { status: 500 });
    }

    if (!attendees || attendees.length === 0) {
      return NextResponse.json({ error: "No attendees found to email" }, { status: 400 });
    }

    const emails = Array.from(new Set(attendees.map(a => a.guest_email)));

    if (!process.env.RESEND_API_KEY) {
      console.log(`[MOCK EMAIL] Broadcasting to ${emails.length} attendees for ${event.title}`);
      console.log(`[MOCK EMAIL] Subject: ${subject}`);
      
      // Increment broadcast count
      await service.from('events').update({ broadcast_count: (event.broadcast_count || 0) + 1 }).eq('id', eventId);
      
      return NextResponse.json({ success: true, count: emails.length, mock: true });
    }

    // Batch send using Resend in chunks of 50
    const chunkSize = 50;
    for (let i = 0; i < emails.length; i += chunkSize) {
      const emailChunk = emails.slice(i, i + chunkSize);
      
      const { error: sendError } = await resend.emails.send({
        from: `SwiftVenue <updates@swiftvenuehq.com>`,
        to: ['updates@swiftvenuehq.com'], // The main to address
        bcc: emailChunk, // Hide attendee emails from each other
        subject: `${subject} - ${event.title}`,
        text: body,
      });

      if (sendError) {
        console.error(`Resend error on chunk ${i / chunkSize}:`, sendError);
        // Continue sending other chunks, but log error
      }
    }

    // Increment broadcast count
    await service.from('events').update({ broadcast_count: (event.broadcast_count || 0) + 1 }).eq('id', eventId);

    return NextResponse.json({ success: true, count: emails.length });
  } catch (error: any) {
    console.error("POST /api/broadcast error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
