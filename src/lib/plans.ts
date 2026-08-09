import { SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * Checks if creating a new attendee for the given event would exceed the organizer's plan limit.
 * If the limit is reached, returns a 403 NextResponse.
 * Otherwise, returns null.
 */
export async function checkGuestLimit(
  service: SupabaseClient,
  eventId: string,
  organizerPlan: string
): Promise<NextResponse | null> {
  // 1. Get the current number of attendees
  const { count: currentAttendees, error: countErr } = await service
    .from('attendees')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId);

  if (countErr) {
    console.error('Error counting attendees:', countErr);
    return NextResponse.json({ error: 'Internal server error while checking guest limit.' }, { status: 500 });
  }

  // 2. Get the organizer's plan limit
  const { data: planLimit, error: planErr } = await service
    .from('plans')
    .select('max_guests_per_event')
    .eq('id', organizerPlan)
    .single();

  if (planErr) {
    console.error('Error fetching plan limit:', planErr);
    return NextResponse.json({ error: 'Internal server error while fetching plan.' }, { status: 500 });
  }

  // 3. Check limit
  if (planLimit?.max_guests_per_event && (currentAttendees ?? 0) >= planLimit.max_guests_per_event) {
    return NextResponse.json(
      { error: 'This event has reached its guest limit for the organizer\'s plan. Ask the organizer to upgrade.' },
      { status: 403 }
    );
  }

  return null;
}
