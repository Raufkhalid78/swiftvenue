import { createServiceClient } from '@/lib/supabase/server';
import { PayoutsClient } from './payouts-client';

export const metadata = {
  title: "Organizer Payouts | SwiftVenue Admin",
};

export default async function AdminPayoutsPage() {
  const service = createServiceClient();
  
  // --- Source 1: Explicit payout requests from the payouts table ---
  const { data: payoutRequests } = await service
    .from('payouts')
    .select(`
      id,
      amount,
      status,
      created_at,
      order_ids,
      profiles (
        full_name,
        email,
        bank_details
      )
    `)
    .order('created_at', { ascending: false });

  // --- Source 2: Events with paid orders that haven't had a request yet ---
  const { data: events } = await service
    .from('events')
    .select(`
      id,
      title,
      slug,
      date,
      payout_status,
      created_at,
      profiles (
        full_name,
        email,
        bank_details
      ),
      orders (
        id,
        status,
        refund_status,
        amount,
        platform_fee_amount,
        organizer_net_amount
      )
    `)
    .order('created_at', { ascending: false });

  // Build set of order IDs already covered by explicit payout requests
  const coveredOrderIds = new Set<string>(
    (payoutRequests || []).flatMap((p: any) => p.order_ids || [])
  );

  // Map events → payout rows, only showing events with uncovered paid orders
  const eventPayouts = (events || []).map((event: any) => {
    const validOrders = (event.orders || []).filter(
      (o: any) => o.status === 'paid' && o.refund_status !== 'refunded' && !coveredOrderIds.has(o.id)
    );
    const totalPayout = validOrders.reduce((sum: number, order: any) => {
      const net = order.organizer_net_amount != null
        ? Number(order.organizer_net_amount)
        : Math.max(0, Number(order.amount || 0) - Number(order.platform_fee_amount || 0));
      return sum + net;
    }, 0);

    return {
      id: event.id,
      type: 'event' as const,
      title: event.title,
      slug: event.slug,
      date: event.date,
      payout_status: event.payout_status,
      total_payout: totalPayout,
      orders: [{ count: validOrders.length }],
      profiles: event.profiles,
    };
  }).filter(p => p.total_payout > 0 || p.payout_status === 'paid');

  // Map explicit payout requests
  const requestPayouts = (payoutRequests || []).map((req: any) => ({
    id: req.id,
    type: 'request' as const,
    title: `Payout Request`,
    slug: null,
    date: req.created_at,
    payout_status: req.status, // 'pending' | 'processing' | 'paid'
    total_payout: Number(req.amount),
    orders: [{ count: req.order_ids?.length || 0 }],
    profiles: req.profiles,
  }));

  // Merge: requests first (most actionable), then uncovered event payouts
  const payouts = [...requestPayouts, ...eventPayouts];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Organizer Payouts</h2>
        <p className="text-muted-foreground">Manage and track bank transfer payouts to event organizers.</p>
      </div>

      <PayoutsClient initialPayouts={payouts} />
    </div>
  );
}
