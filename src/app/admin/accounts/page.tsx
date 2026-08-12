import { redirect } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { AccountsClient } from './accounts-client';

export const metadata = {
  title: 'Accounts | SwiftVenue Admin',
};

export default async function AccountsPage() {
  const supabase = await createClient();
  const service = createServiceClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: admin } = await service.from('profiles').select('is_admin').eq('id', user.id).single();
  if (!admin?.is_admin) {
    redirect('/dashboard');
  }

  // 1. Fetch Ticketing Data
  const { data: orders } = await service
    .from('orders')
    .select('id, amount, platform_fee_amount, organizer_net_amount, created_at')
    .eq('status', 'paid')
    .neq('refund_status', 'refunded');

  let grossTicketingVolume = 0;
  let ticketingProfit = 0;
  let organizerLiabilities = 0;

  if (orders) {
    orders.forEach(order => {
      grossTicketingVolume += Number(order.amount || 0);
      ticketingProfit += Number(order.platform_fee_amount || 0);
      
      const net = order.organizer_net_amount != null 
        ? Number(order.organizer_net_amount) 
        : Math.max(0, Number(order.amount || 0) - Number(order.platform_fee_amount || 0));
        
      organizerLiabilities += net;
    });
  }

  // 2. Fetch Subscription Data
  // We need to join upgrade_requests with plans to get the monthly_price
  const { data: upgradeRequests } = await service
    .from('upgrade_requests')
    .select('id, plan_id, status, created_at, plans(monthly_price)')
    .eq('status', 'approved');

  let subscriptionProfit = 0;

  if (upgradeRequests) {
    upgradeRequests.forEach((req: any) => {
      // Depending on the join, plans might be an object or array.
      const plan = Array.isArray(req.plans) ? req.plans[0] : req.plans;
      if (plan && plan.monthly_price) {
        subscriptionProfit += Number(plan.monthly_price);
      }
    });
  }

  const totalPlatformProfit = ticketingProfit + subscriptionProfit;

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight">Platform Financials</h1>
        <p className="text-muted-foreground mt-2">Track total revenue, platform profit, and organizer liabilities.</p>
      </div>
      
      <AccountsClient 
        grossTicketingVolume={grossTicketingVolume}
        ticketingProfit={ticketingProfit}
        organizerLiabilities={organizerLiabilities}
        subscriptionProfit={subscriptionProfit}
        totalPlatformProfit={totalPlatformProfit}
      />
    </div>
  );
}
