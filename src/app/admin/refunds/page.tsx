import { createServiceClient } from '@/lib/supabase/server';
import { RefundsClient } from './refunds-client';

export const metadata = {
  title: "Refund Requests | SwiftVenue Admin",
};

export default async function AdminRefundsPage() {
  const service = createServiceClient();
  
  // Fetch orders that have a refund requested
  const { data: rawRefunds, error } = await service
    .from('orders')
    .select('id, amount, currency, guest_name, guest_email, refund_status, created_at, event_id')
    .in('refund_status', ['requested', 'refunded'])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to load refunds in AdminRefundsPage:', error);
  }

  const refundsList = rawRefunds || [];
  const eventIds = Array.from(new Set(refundsList.map(r => r.event_id).filter(Boolean)));

  let eventsMap: Record<string, { title: string; slug: string }> = {};
  if (eventIds.length > 0) {
    const { data: events } = await service
      .from('events')
      .select('id, title, slug')
      .in('id', eventIds);

    if (events) {
      events.forEach(e => {
        eventsMap[e.id] = { title: e.title, slug: e.slug };
      });
    }
  }

  const refunds = refundsList.map(refund => ({
    ...refund,
    events: eventsMap[refund.event_id] || { title: 'Unknown Event', slug: '' }
  }));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Refund Queue</h2>
        <p className="text-muted-foreground">Manage and process guest ticket refund requests.</p>
      </div>

      <RefundsClient initialRefunds={refunds} />
    </div>
  );
}
