import { createServiceClient } from '@/lib/supabase/server';
import { PayoutsClient } from './payouts-client';

export const metadata = {
  title: "Organizer Payouts | SwiftVenue Admin",
};

export default async function AdminPayoutsPage() {
  const service = createServiceClient();
  
  // Fetch all events with their orders to calculate payout amounts
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

  // Map and calculate payouts
  const payouts = (events || []).map((event: any) => {
    const validOrders = (event.orders || []).filter((o: any) => o.status === 'paid' && o.refund_status !== 'refunded');
    const totalPayout = validOrders.reduce((sum: number, order: any) => {
      // Fall back to amount - platform_fee_amount for older orders where organizer_net_amount was NULL
      const net = order.organizer_net_amount != null
        ? Number(order.organizer_net_amount)
        : Math.max(0, Number(order.amount || 0) - Number(order.platform_fee_amount || 0));
      return sum + net;
    }, 0);
    
    // Show events with earnings (pending or already paid out)
    const processedEvent = {
      ...event,
      total_payout: totalPayout,
      orders: [{ count: validOrders.length }]
    };
    
    return processedEvent;
  }).filter(p => p.total_payout > 0 || p.payout_status === 'paid');

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
