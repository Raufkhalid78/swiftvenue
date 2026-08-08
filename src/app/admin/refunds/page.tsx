import { createServiceClient } from '@/lib/supabase/server';
import { RefundsClient } from './refunds-client';

export const metadata = {
  title: "Refund Requests | SwiftVenue Admin",
};

export default async function AdminRefundsPage() {
  const service = createServiceClient();
  
  // Fetch orders that have a refund requested
  const { data: refunds } = await service
    .from('orders')
    .select(`
      id,
      amount,
      currency,
      guest_name,
      guest_email,
      refund_status,
      created_at,
      events (
        title,
        slug
      )
    `)
    .in('refund_status', ['requested', 'refunded'])
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Refund Queue</h2>
        <p className="text-muted-foreground">Manage and process guest ticket refund requests.</p>
      </div>

      <RefundsClient initialRefunds={refunds || []} />
    </div>
  );
}
