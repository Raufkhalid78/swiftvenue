'use server';

import { createClient } from '@/lib/supabase/server';

export async function syncAttendees(eventId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  // Verify ownership
  const { data: event } = await supabase.from('events').select('user_id').eq('id', eventId).single();
  if (!event || event.user_id !== user.id) throw new Error('Unauthorized');

  const { data: attendees, error } = await supabase
    .from('attendees')
    .select('id, guest_name, status, ticket_types(name)')
    .eq('event_id', eventId);

  if (error) throw new Error(error.message);

  return attendees.map(a => ({
    id: a.id,
    guestName: a.guest_name,
    status: a.status,
    ticketType: (a.ticket_types as any)?.name || 'General'
  }));
}

export async function bulkCheckIn(eventId: string, outbox: string[]) {
  if (!outbox || outbox.length === 0) return { success: true, count: 0 };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  // Verify ownership
  const { data: event } = await supabase.from('events').select('user_id').eq('id', eventId).single();
  if (!event || event.user_id !== user.id) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('attendees')
    .update({ status: 'checked_in' })
    .in('id', outbox)
    .eq('event_id', eventId)
    // Only update if they weren't cancelled/refunded
    .in('status', ['registered']);

  if (error) throw new Error(error.message);

  return { success: true, count: outbox.length };
}
