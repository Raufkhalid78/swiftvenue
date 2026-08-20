import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { checkEventAccess } from "@/lib/team";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const supabase = await createClient();
    const service = createServiceClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify team access (owner or coorganizer)
    // Parallelize access check, event lookup, and ticket type lookup
    const [hasAccess, eventRes, ticketsRes, profileRes] = await Promise.all([
      checkEventAccess(service, eventId, user.id, ['owner', 'coorganizer']),
      service.from("events").select("status, user_id").eq("id", eventId).single(),
      service.from("ticket_types").select("price").eq("event_id", eventId).eq("is_active", true),
      service.from("profiles").select("plan, plans(max_concurrent_paid_events)").eq("id", user.id).single(),
    ]);

    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: event, error: eventErr } = eventRes;
    if (eventErr || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.status === "published") {
      return NextResponse.json({ success: true, message: "Event is already published" });
    }

    const { data: ticketTypes, error: ticketErr } = ticketsRes;
    if (ticketErr) {
      return NextResponse.json({ error: "Failed to fetch ticket types" }, { status: 500 });
    }

    const hasPaidTickets = ticketTypes && ticketTypes.some(t => Number(t.price) > 0);

    // If it's a paid event, enforce the concurrent limit
    if (hasPaidTickets) {
      const planData = profileRes.data?.plans as any;
      const maxConcurrent = Array.isArray(planData) ? planData[0]?.max_concurrent_paid_events : planData?.max_concurrent_paid_events;

      if (maxConcurrent !== null && maxConcurrent !== undefined) {
        // Find all published events by this user
        const { data: publishedEvents } = await service
          .from("events")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "published");

        if (publishedEvents && publishedEvents.length > 0) {
          const eventIds = publishedEvents.map(e => e.id);
          
          const { data: activePaidTickets } = await service
            .from("ticket_types")
            .select("event_id")
            .in("event_id", eventIds)
            .eq("is_active", true)
            .gt("price", 0);

          const uniquePaidEventsCount = new Set((activePaidTickets || []).map(t => t.event_id)).size;

          if (uniquePaidEventsCount >= maxConcurrent) {
            return NextResponse.json(
              { error: `You have reached the maximum of ${maxConcurrent} concurrent paid event(s) allowed on your current plan. Please upgrade your plan to publish more.` },
              { status: 403 }
            );
          }
        }
      }
    }

    // All checks passed, publish the event
    const { error: updateErr } = await service
      .from("events")
      .update({ status: "published" })
      .eq("id", eventId);

    if (updateErr) {
      return NextResponse.json({ error: "Failed to publish event" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/events/[id]/publish error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
