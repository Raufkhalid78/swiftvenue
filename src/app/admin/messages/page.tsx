import { createServiceClient } from '@/lib/supabase/server';
import { MessagesClient } from './messages-client';

export const metadata = {
  title: "Contact Messages | SwiftVenue Admin",
};

export default async function AdminMessagesPage() {
  const service = createServiceClient();
  
  // Fetch messages
  const { data: messages } = await service
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Contact Messages</h2>
        <p className="text-muted-foreground">Manage and resolve inquiries from the contact form.</p>
      </div>

      <MessagesClient initialMessages={messages || []} />
    </div>
  );
}
