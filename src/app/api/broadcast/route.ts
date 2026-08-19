import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { checkEventAccess } from "@/lib/team";
import { processBroadcastJob } from "@/lib/broadcast-queue";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json({ error: "Missing eventId" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const service = createServiceClient();
    const hasAccess = await checkEventAccess(service, eventId, user.id, ['owner', 'coorganizer']);
    if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { data: jobs, error } = await service
      .from('broadcast_jobs')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ jobs: jobs || [] });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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

    const emails = Array.from(new Set(attendees.map(a => a.guest_email).filter(Boolean)));

    // Create queued broadcast job record
    const { data: job, error: jobErr } = await service
      .from('broadcast_jobs')
      .insert({
        event_id: eventId,
        subject,
        body,
        total_recipients: emails.length,
        status: 'queued',
      })
      .select()
      .single();

    if (jobErr || !job) {
      return NextResponse.json({ error: "Failed to create broadcast job" }, { status: 500 });
    }

    // Increment broadcast count on event
    await service.from('events').update({ broadcast_count: (event.broadcast_count || 0) + 1 }).eq('id', eventId);

    // Process job
    await processBroadcastJob(job.id, eventId, event.title, emails, subject, body);

    return NextResponse.json({ success: true, jobId: job.id, count: emails.length });
  } catch (error: any) {
    console.error("POST /api/broadcast error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
