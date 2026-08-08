import { createServiceClient } from '@/lib/supabase/server';
import { AdminUpgradeRequestsClient } from './admin-client';

export const metadata = {
  title: "Upgrade Requests | SwiftVenue Admin",
};

export default async function AdminUpgradeRequestsPage() {
  const service = createServiceClient();

  // Fetch all requests
  const { data: requests, error } = await service
    .from('upgrade_requests')
    .select(`
      id,
      plan_id,
      reference_number,
      status,
      created_at,
      profiles ( full_name, email ),
      plans ( name )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to load upgrade requests:', error);
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Upgrade Requests</h2>
        <p className="text-muted-foreground">Review and approve organizer subscription upgrades.</p>
      </div>

      <AdminUpgradeRequestsClient initialRequests={(requests as any) || []} />
    </div>
  );
}
