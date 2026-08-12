import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PromosClient } from './promos-client';

export const metadata = {
  title: 'Promo Codes | SwiftVenue',
};

export default async function PromosPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const eventId = resolvedParams.id;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Verify ownership
  const { data: event } = await supabase
    .from('events')
    .select('id, user_id')
    .eq('id', eventId)
    .single();

  if (!event || event.user_id !== user.id) {
    redirect('/dashboard');
  }

  // Fetch promo codes
  const { data: promos } = await supabase
    .from('promo_codes')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Promo Codes</h2>
        <p className="text-muted-foreground text-sm">Create and manage discount codes for your event.</p>
      </div>

      <PromosClient eventId={eventId} initialPromos={promos || []} />
    </div>
  );
}
