import { createClient, createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { checkEventAccess } from '@/lib/team';
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

  // Verify team access
  const service = createServiceClient();
  const hasAccess = await checkEventAccess(service, eventId, user.id, ['owner', 'coorganizer']);
  
  if (!hasAccess) {
    redirect('/dashboard');
  }

  // Fetch promo codes and ticket types in parallel
  const [promosRes, ticketTypesRes] = await Promise.all([
    supabase
      .from('promo_codes')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false }),
    supabase
      .from('ticket_types')
      .select('id, name, price')
      .eq('event_id', eventId)
      .eq('is_active', true)
      .order('order_index', { ascending: true })
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Promo Codes</h2>
        <p className="text-muted-foreground text-sm">Create and manage discount codes for your event.</p>
      </div>

      <PromosClient 
        eventId={eventId} 
        initialPromos={promosRes.data || []} 
        ticketTypes={ticketTypesRes.data || []} 
      />
    </div>
  );
}
