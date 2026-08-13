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
    const hasAccess = await checkEventAccess(service, eventId, user.id, ['owner', 'coorganizer']);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch event status
    const { data: event, error: eventErr } = await service
      .from("events")
      .select("status")
      .eq("id", eventId)
      .single();

    if (eventErr || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.status === "published") {
      return NextResponse.json({ success: true, message: "Event is already published" });
    }

    // Check if the event has any paid tickets
    const { data: ticketTypes, error: ticketErr } = await service
      .from("ticket_types")
      .select("price")
      .eq("event_id", eventId)
      .eq("is_active", true);

    if (ticketErr) {
      return NextResponse.json({ error: "Failed to fetch ticket types" }, { status: 500 });
    }

    const hasPaidTickets = ticketTypes && ticketTypes.some(t => Number(t.price) > 0);

    // If it's a paid event, we need to enforce the concurrent limit
    if (hasPaidTickets) {
      // 1. Get the user's plan
      const { data: profile } = await service
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .single();

      const userPlan = profile?.plan || "free";

      // 2. Get the plan limits
      const { data: planConfig } = await service
        .from("plans")
        .select("max_concurrent_paid_events")
        .eq("id", userPlan)
        .single();

      const maxConcurrent = planConfig?.max_concurrent_paid_events;

      // 3. If there is a limit (not null), check current active paid events
      if (maxConcurrent !== null && maxConcurrent !== undefined) {
        // Find all published events by this user
        const { data: publishedEvents } = await service
          .from("events")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "published");

        if (publishedEvents && publishedEvents.length > 0) {
          // We need to see how many of these published events are *paid* events
          const eventIds = publishedEvents.map(e => e.id);
          
          const { data: activePaidTickets } = await service
            .from("ticket_types")
            .select("event_id")
            .in("event_id", eventIds)
            .eq("is_active", true)
            .gt("price", 0);

          // Count unique events that have at least one paid ticket
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
