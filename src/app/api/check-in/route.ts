import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

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
      .select("*, events(title, organizer_id), ticket_types(name)")
      .eq("id", attendeeId)
      .single();

    if (fetchError || !attendee) {
      return NextResponse.json({ error: "Invalid ticket (Attendee not found)" }, { status: 404 });
    }

    // Since events is a one-to-many relation joined here, it comes back as an object or array depending on foreign keys.
    // For attendees to events, it's a many-to-one, so it's a single object.
    const event = Array.isArray(attendee.events) ? attendee.events[0] : attendee.events;
    
    if (event?.organizer_id !== user.id) {
      return NextResponse.json({ error: "Forbidden: You do not own the event for this ticket." }, { status: 403 });
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

    return NextResponse.json({ success: true, attendee });
  } catch (error: any) {
    console.error("POST /api/check-in error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
