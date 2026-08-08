import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { eventId, guestName, guestEmail, ticketTypeId } = await request.json();

    if (!eventId || !guestName || !guestEmail || !ticketTypeId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const service = createServiceClient();

    // Verify ticket type is actually sold out
    const { data: ticketType, error: ticketError } = await service
      .from("ticket_types")
      .select("quantity_total, quantity_sold")
      .eq("id", ticketTypeId)
      .single();

    if (ticketError || !ticketType) {
      return NextResponse.json(
        { error: "Ticket type not found" },
        { status: 404 }
      );
    }

    const available = ticketType.quantity_total - ticketType.quantity_sold;
    if (available > 0) {
      return NextResponse.json(
        { error: "Tickets are still available, no need for waitlist." },
        { status: 400 }
      );
    }

    // Insert into waitlist
    const { error: waitlistError } = await service
      .from("waitlists")
      .insert({
        event_id: eventId,
        ticket_type_id: ticketTypeId,
        guest_name: guestName,
        guest_email: guestEmail,
        status: "waiting"
      });

    if (waitlistError) {
      console.error("Failed to insert waitlist:", waitlistError);
      return NextResponse.json(
        { error: "Failed to join waitlist" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/waitlist/join error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
