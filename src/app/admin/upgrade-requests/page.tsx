import { createServiceClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminUpgradeRequestsClient } from './admin-client';
import { ShieldAlert } from 'lucide-react';

export const metadata = {
  title: "Upgrade Requests | SwiftVenue Admin",
};

export default async function AdminUpgradeRequestsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const service = createServiceClient();
  
  // Verify admin status
  const { data: admin } = await service
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!admin?.is_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">You do not have permission to view this page. This area is restricted to administrators.</p>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-muted/30">
      {/* Basic Admin Header */}
      <header className="bg-background border-b px-6 py-4 sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary text-primary-foreground p-1.5 rounded">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <h1 className="font-semibold text-lg">SwiftVenue Admin</h1>
        </div>
        <div className="text-sm text-muted-foreground">
          Logged in as {user.email}
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Upgrade Requests</h2>
          <p className="text-muted-foreground">Review and approve organizer subscription upgrades.</p>
        </div>

        <AdminUpgradeRequestsClient initialRequests={(requests as any) || []} />
      </main>
    </div>
  );
}
