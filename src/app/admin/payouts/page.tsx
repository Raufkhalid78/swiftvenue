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
        organizer_net_amount
      )
    `)
    .order('created_at', { ascending: false });

  // Map and calculate payouts
  const payouts = (events || []).map((event: any) => {
    const validOrders = (event.orders || []).filter((o: any) => o.status === 'paid' && o.refund_status !== 'refunded');
    const totalPayout = validOrders.reduce((sum: number, order: any) => sum + Number(order.organizer_net_amount || 0), 0);
    
    // We only want to show events that have a payout amount > 0 or have already been paid out.
    // Replace the raw orders array with just a count to keep the payload small
    const processedEvent = {
      ...event,
      total_payout: totalPayout,
      orders: [{ count: validOrders.length }]
    };
    
    return processedEvent;
  }).filter(p => p.total_payout > 0);

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
