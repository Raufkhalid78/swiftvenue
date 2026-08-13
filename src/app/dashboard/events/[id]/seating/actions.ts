'use server';

import { createClient, createServiceClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { checkEventAccess } from '@/lib/team';

export async function saveSeatingLayout(eventId: string, layoutData: any, seatsToUpsert: any[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  // Verify team access
  const service = createServiceClient();
  const hasAccess = await checkEventAccess(service, eventId, user.id, ['owner', 'coorganizer']);
  if (!hasAccess) throw new Error('Unauthorized');

  // Upsert layout
  let layoutId;
  const { data: existingLayout } = await supabase.from('seating_layouts').select('id').eq('event_id', eventId).single();
  
  if (existingLayout) {
    layoutId = existingLayout.id;
    await supabase.from('seating_layouts').update({ layout_data_json: layoutData }).eq('id', layoutId);
  } else {
    const { data: newLayout } = await supabase.from('seating_layouts').insert({
      event_id: eventId,
      layout_data_json: layoutData
    }).select('id').single();
    if (!newLayout) throw new Error("Failed to create layout");
    layoutId = newLayout.id;
  }

  // Handle Seats
  // First, get existing seats
  const { data: existingSeats } = await supabase.from('seats').select('id, label').eq('layout_id', layoutId);
  
  // Delete seats that are no longer in the map (and aren't sold)
  if (existingSeats) {
    const incomingLabels = seatsToUpsert.map(s => s.label);
    const toDelete = existingSeats.filter(s => !incomingLabels.includes(s.label)).map(s => s.id);
    if (toDelete.length > 0) {
      await supabase.from('seats').delete().in('id', toDelete).eq('status', 'available'); // Only delete available ones
    }
  }

  // Insert/Update seats
  for (const seat of seatsToUpsert) {
    const existing = existingSeats?.find(s => s.label === seat.label);
    if (existing) {
      await supabase.from('seats').update({
        ticket_type_id: seat.ticket_type_id || null
      }).eq('id', existing.id);
    } else {
      await supabase.from('seats').insert({
        layout_id: layoutId,
        label: seat.label,
        ticket_type_id: seat.ticket_type_id || null
      });
    }
  }

  revalidatePath(`/dashboard/events/${eventId}/seating`);
  revalidatePath(`/e/[slug]`, 'page');
  return { success: true };
}
