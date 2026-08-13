import { createServiceClient } from '@/lib/supabase/server';
import { PayoutsClient } from './payouts-client';

export const metadata = {
  title: "Organizer Payouts | SwiftVenue Admin",
};

export default async function AdminPayoutsPage() {
  const service = createServiceClient();
  



  
  // 1. Parallelize base queries
  const [payoutsRes, eventsRes] = await Promise.all([
    service
      .from('payouts')
      .select(`
        id,
        user_id,
        amount,
        status,
        created_at,
        order_ids,
        profiles (
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false }),
    service
      .from('events')
      .select(`
        id,
        title,
        slug,
        date,
        payout_status,
        user_id,
        created_at,
        profiles (
          full_name,
          email
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
      .order('created_at', { ascending: false })
  ]);

  const payoutRequestsFull = payoutsRes.data;
  const events = eventsRes.data;

  // 2. Combine all User IDs and batch-fetch payout methods in one go
  const reqUserIds = (payoutRequestsFull || []).map((p: any) => p.user_id);
  const eventUserIds = (events || []).map((e: any) => e.user_id);
  const allUserIds = [...new Set([...reqUserIds, ...eventUserIds].filter(Boolean))];

  const { data: allMethods } = allUserIds.length > 0
    ? await service.from('organizer_payout_methods').select('user_id, method, account_details').in('user_id', allUserIds)
    : { data: [] };
  
  const allPayoutMethodMap = Object.fromEntries((allMethods || []).map((m: any) => [m.user_id, m]));

  // Build set of order IDs already covered by explicit payout requests
  const coveredOrderIds = new Set<string>(
    (payoutRequestsFull || []).flatMap((p: any) => p.order_ids || [])
  );

  function formatPayoutMethod(method: any) {
    if (!method) return null;
    return {
      method: method.method,
      account_details: method.account_details,
      display: `${method.method?.toUpperCase()}: ${method.account_details?.text || JSON.stringify(method.account_details || {})}`
    };
  }

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

    const payoutMethod = formatPayoutMethod(allPayoutMethodMap[event.user_id]);

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
      payout_method: payoutMethod,
    };
  }).filter(p => p.total_payout > 0 || p.payout_status === 'paid');

  // Map explicit payout requests
  const requestPayouts = (payoutRequestsFull || []).map((req: any) => {
    const payoutMethod = formatPayoutMethod(allPayoutMethodMap[req.user_id]);
    return {
      id: req.id,
      type: 'request' as const,
      title: `Payout Request`,
      slug: null,
      date: req.created_at,
      payout_status: req.status,
      total_payout: Number(req.amount),
      orders: [{ count: req.order_ids?.length || 0 }],
      profiles: req.profiles,
      payout_method: payoutMethod,
    };
  });

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
