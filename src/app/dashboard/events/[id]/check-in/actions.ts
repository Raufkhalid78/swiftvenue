'use server';

import { createClient, createServiceClient } from '@/lib/supabase/server';
import { checkEventAccess } from '@/lib/team';

export async function syncAttendees(eventId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  // Verify team access
  const service = createServiceClient();
  const hasAccess = await checkEventAccess(service, eventId, user.id, ['owner', 'coorganizer', 'checkin_staff']);
  if (!hasAccess) throw new Error('Unauthorized');

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

  // Verify team access
  const service = createServiceClient();
  const hasAccess = await checkEventAccess(service, eventId, user.id, ['owner', 'coorganizer', 'checkin_staff']);
  if (!hasAccess) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('attendees')
    .update({ status: 'attended' })
    .in('id', outbox)
    .eq('event_id', eventId)
    // Only update if they weren't cancelled/refunded
    .in('status', ['registered']);

  if (error) throw new Error(error.message);

  return { success: true, count: outbox.length };
}
