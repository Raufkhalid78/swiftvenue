import { createServiceClient } from '@/lib/supabase/server';
import { EventsClient } from './events-client';

export const metadata = {
  title: "Event Moderation | SwiftVenue Admin",
};

export default async function AdminEventsPage() {
  const service = createServiceClient();
  
  const { data: rawEvents, error } = await service
    .from('events')
    .select('id, user_id, title, slug, type, date, time, status, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to load events in AdminEventsPage:', error);
  }

  const eventsList = rawEvents || [];
  const userIds = Array.from(new Set(eventsList.map(e => e.user_id).filter(Boolean)));

  let profilesMap: Record<string, { full_name: string | null; email: string | null }> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await service
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds);

    if (profiles) {
      profiles.forEach(p => {
        profilesMap[p.id] = { full_name: p.full_name, email: p.email };
      });
    }
  }

  const events = eventsList.map(event => ({
    ...event,
    profiles: profilesMap[event.user_id] || { full_name: 'Unknown', email: 'No email' }
  }));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Event Moderation</h2>
        <p className="text-muted-foreground">Monitor and manage all events created across the platform.</p>
      </div>

      <EventsClient initialEvents={events} />
    </div>
  );
}
