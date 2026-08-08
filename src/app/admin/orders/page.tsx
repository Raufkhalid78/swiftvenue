import { createServiceClient } from '@/lib/supabase/server';
import { OrdersClient } from './orders-client';

export const metadata = {
  title: "Global Orders | SwiftVenue Admin",
};

export default async function AdminOrdersPage() {
  const service = createServiceClient();
  
  const { data: orders } = await service
    .from('orders')
    .select(`
      *,
      events (
        title,
        slug
      )
    `)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Global Orders</h2>
        <p className="text-muted-foreground">View all ticket purchases and transactions across the platform.</p>
      </div>

      <OrdersClient initialOrders={orders || []} />
    </div>
  );
}
