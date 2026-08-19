import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { checkEventAccess } from "@/lib/team";

export async function POST(request: NextRequest) {
  try {
    const { attendeeId } = await request.json();

    if (!attendeeId) {
      return NextResponse.json({ error: "Missing attendee ID" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const service = createServiceClient();

    // Fetch attendee to ensure it exists and get current status
    const { data: attendee, error: fetchError } = await service
      .from("attendees")
      .select("*, events(id, title, user_id, date, time), ticket_types(name)")
      .eq("id", attendeeId)
      .single();

    if (fetchError || !attendee) {
      return NextResponse.json({ error: "Invalid ticket (Attendee not found)" }, { status: 404 });
    }

    // Since events is a one-to-many relation joined here, it comes back as an object or array depending on foreign keys.
    // For attendees to events, it's a many-to-one, so it's a single object.
    const event = Array.isArray(attendee.events) ? attendee.events[0] : attendee.events;
    
    const hasAccess = await checkEventAccess(service, event.id || attendee.event_id, user.id, ['owner', 'coorganizer', 'checkin_staff']);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden: You do not have permission to check-in for this event." }, { status: 403 });
    }

    if (event.date && event.time) {
      const eventDateTime = new Date(`${event.date}T${event.time}:00`);
      if (!isNaN(eventDateTime.getTime())) {
        const now = new Date();
        const hoursUntilEvent = (eventDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        if (hoursUntilEvent > 24) {
          return NextResponse.json({ error: "Check-in not open yet. Tickets can be scanned 24 hours before the event starts." }, { status: 403 });
        }
      }
    }

    if (attendee.status === "attended") {
      return NextResponse.json({ error: "Ticket already used!", attendee }, { status: 409 });
    }

    // Mark as attended
    const { error: updateError } = await service
      .from("attendees")
      .update({ status: "attended" })
      .eq("id", attendeeId);

    if (updateError) {
      console.error("Failed to update attendee status:", updateError);
      return NextResponse.json({ error: "Database error while updating" }, { status: 500 });
    }

    // Dispatch outbound webhook
    const { dispatchWebhook } = await import('@/lib/webhooks');
    dispatchWebhook(event.id || attendee.event_id, 'attendee.checked_in', {
      attendeeId: attendee.id,
      guestName: attendee.guest_name,
      guestEmail: attendee.guest_email,
      ticketTier: (attendee.ticket_types as any)?.name || 'General',
      checkedInAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, attendee });
  } catch (error: any) {
    console.error("POST /api/check-in error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
