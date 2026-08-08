import { createServiceClient } from '@/lib/supabase/server';
import { EventsClient } from './events-client';

export const metadata = {
  title: "Event Moderation | SwiftVenue Admin",
};

export default async function AdminEventsPage() {
  const service = createServiceClient();
  
  const { data: events } = await service
    .from('events')
    .select(`
      id,
      title,
      slug,
      type,
      date,
      time,
      status,
      created_at,
      profiles (
        full_name,
        email
      )
    `)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Event Moderation</h2>
        <p className="text-muted-foreground">Monitor and manage all events created across the platform.</p>
      </div>

      <EventsClient initialEvents={events || []} />
    </div>
  );
}
