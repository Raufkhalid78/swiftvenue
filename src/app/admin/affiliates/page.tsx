import { createServiceClient } from '@/lib/supabase/server';
import { AffiliatesClient } from './affiliates-client';

export const metadata = {
  title: "Affiliate Management | SwiftVenue Admin",
};

export default async function AdminAffiliatesPage() {
  const service = createServiceClient();
  
  // Fetch pending applications
  const { data: applications } = await service
    .from('affiliate_applications')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  // Fetch pending/cleared commissions
  const { data: commissions } = await service
    .from('affiliate_commissions')
    .select(`
      *,
      profiles:affiliate_id (
        full_name,
        email
      )
    `)
    .in('status', ['pending', 'cleared'])
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Affiliate Management</h2>
        <p className="text-muted-foreground">Approve new affiliate applications and process their commission payouts.</p>
      </div>

      <AffiliatesClient 
        initialApplications={applications || []} 
        initialCommissions={commissions || []}
      />
    </div>
  );
}
