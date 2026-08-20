'use server';

import { createClient, createServiceClient } from '@/lib/supabase/server';
import { checkEventAccess } from '@/lib/team';
import { redirect } from 'next/navigation';

export async function duplicateEvent(sourceEventId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const service = createServiceClient();
  const hasAccess = await checkEventAccess(service, sourceEventId, user.id, ['owner', 'coorganizer']);
  if (!hasAccess) throw new Error('Unauthorized');

  const { data: source } = await service.from('events').select('*').eq('id', sourceEventId).single();
  if (!source) throw new Error('Event not found');

  // Generate a unique slug in a single query
  const baseSlug = `${source.slug}-copy`;
  const { data: matchingSlugs } = await service
    .from('events')
    .select('slug')
    .ilike('slug', `${baseSlug}%`);

  const existingSlugSet = new Set((matchingSlugs || []).map(s => s.slug));
  let newSlug = baseSlug;
  let suffix = 1;
  while (existingSlugSet.has(newSlug)) {
    newSlug = `${baseSlug}-${++suffix}`;
  }

  const { data: newEvent, error } = await service.from('events').insert({
    ...source,
    id: undefined, // let Postgres generate a new one
    slug: newSlug,
    title: `${source.title} (Copy)`,
    status: 'draft',
    date: null, // force the organizer to set a new date before publishing — never carry the old one forward silently
    reminder_sent_at: null,
    survey_sent_at: null,
    created_at: undefined,
  }).select().single();

  if (error || !newEvent) throw new Error('Failed to duplicate event');

  // Clone related tables in parallel — none depend on each other
  const [ticketTypes, agendaItems, speakers, sponsors, faqs, seatingLayout, collaborators] = await Promise.all([
    service.from('ticket_types').select('*').eq('event_id', sourceEventId),
    service.from('agenda_items').select('*').eq('event_id', sourceEventId),
    service.from('event_speakers').select('*').eq('event_id', sourceEventId),
    service.from('event_sponsors').select('*').eq('event_id', sourceEventId),
    service.from('event_faqs').select('*').eq('event_id', sourceEventId),
    service.from('seating_layouts').select('*').eq('event_id', sourceEventId).maybeSingle(),
    service.from('event_collaborators').select('*').eq('event_id', sourceEventId),
  ]);

  const stripAndRetarget = (rows: any[] | null) =>
    (rows || []).map(({ id: _id, event_id: _event_id, quantity_sold, ...rest }) => ({
      ...rest,
      event_id: newEvent.id,
      ...(quantity_sold !== undefined ? { quantity_sold: 0 } : {}), // reset sales counts on the copy
    }));

  await Promise.all([
    ticketTypes.data?.length ? service.from('ticket_types').insert(stripAndRetarget(ticketTypes.data)) : null,
    agendaItems.data?.length ? service.from('agenda_items').insert(stripAndRetarget(agendaItems.data)) : null,
    speakers.data?.length ? service.from('event_speakers').insert(stripAndRetarget(speakers.data)) : null,
    sponsors.data?.length ? service.from('event_sponsors').insert(stripAndRetarget(sponsors.data)) : null,
    faqs.data?.length ? service.from('event_faqs').insert(stripAndRetarget(faqs.data)) : null,
    collaborators.data?.length ? service.from('event_collaborators').insert(stripAndRetarget(collaborators.data)) : null,
  ]);

  // Seating is a bit more involved — clone the layout, then the seats referencing the new layout_id
  if (seatingLayout.data) {
    const { id: oldLayoutId, event_id: _event_id, ...layoutRest } = seatingLayout.data;
    const { data: newLayout } = await service.from('seating_layouts').insert({ ...layoutRest, event_id: newEvent.id }).select().single();
    if (newLayout) {
      const { data: seats } = await service.from('seats').select('*').eq('layout_id', oldLayoutId);
      if (seats?.length) {
        const clonedSeats = seats.map(({ id: _id, layout_id: _layout_id, status: _status, locked_by: _locked_by, locked_until: _locked_until, ...rest }) => ({
          ...rest, layout_id: newLayout.id, status: 'available', // every seat resets to available on the copy
        }));
        await service.from('seats').insert(clonedSeats);
      }
    }
  }

  redirect(`/dashboard/events/${newEvent.id}`);
}
