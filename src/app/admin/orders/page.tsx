import { createServiceClient } from '@/lib/supabase/server';
import { OrdersClient } from './orders-client';

export const metadata = {
  title: "Global Orders | SwiftVenue Admin",
};

export default async function AdminOrdersPage() {
  const service = createServiceClient();
  
  const { data: rawOrders, error } = await service
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to load orders in AdminOrdersPage:', error);
  }

  const ordersList = rawOrders || [];
  const eventIds = Array.from(new Set(ordersList.map(o => o.event_id).filter(Boolean)));

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

  const orders = ordersList.map(order => ({
    ...order,
    events: eventsMap[order.event_id] || { title: 'Unknown Event', slug: '' }
  }));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Global Orders</h2>
        <p className="text-muted-foreground">View all ticket purchases and transactions across the platform.</p>
      </div>

      <OrdersClient initialOrders={orders} />
    </div>
  );
}
