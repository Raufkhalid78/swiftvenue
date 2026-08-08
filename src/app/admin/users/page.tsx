import { createServiceClient } from '@/lib/supabase/server';
import { UsersClient } from './users-client';

export const metadata = {
  title: "User Management | SwiftVenue Admin",
};

export default async function AdminUsersPage() {
  const service = createServiceClient();
  
  const [{ data: users }, { data: plans }] = await Promise.all([
    service.from('profiles').select('*').order('created_at', { ascending: false }),
    service.from('plans').select('id, name').order('monthly_price', { ascending: true })
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
        <p className="text-muted-foreground">Manage user accounts, roles, and platform access.</p>
      </div>

      <UsersClient initialUsers={users || []} plans={plans || []} />
    </div>
  );
}
