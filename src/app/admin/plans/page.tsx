import { createServiceClient } from '@/lib/supabase/server';
import { PlansClient } from './plans-client';

export const metadata = {
  title: "Subscription Plans | SwiftVenue Admin",
};

export default async function AdminPlansPage() {
  const service = createServiceClient();
  
  // Fetch all plans
  const { data: plans } = await service
    .from('plans')
    .select('*')
    .order('monthly_price', { ascending: true, nullsFirst: true });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Subscription Plans</h2>
        <p className="text-muted-foreground">Manage platform pricing and feature limits for organizers.</p>
      </div>

      <PlansClient initialPlans={plans || []} />
    </div>
  );
}
