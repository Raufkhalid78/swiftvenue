'use client';

import { useState } from 'react';
import { Search, Shield, Ban, CheckCircle2 } from 'lucide-react';
import { updateUserPlan, toggleUserSuspension } from './actions';

export function UsersClient({ initialUsers, plans }: { initialUsers: any[], plans: any[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handlePlanChange = async (userId: string, newPlanId: string) => {
    setLoadingId(userId);
    const result = await updateUserPlan(userId, newPlanId);
    if (result.success) {
      setUsers(users.map(u => u.id === userId ? { ...u, plan: newPlanId, plans: plans.find(p => p.id === newPlanId) } : u));
    } else {
      alert(result.error);
    }
    setLoadingId(null);
  };

  const handleToggleSuspension = async (userId: string, currentStatus: boolean) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'activate' : 'suspend'} this user?`)) return;
    
    setLoadingId(userId);
    const result = await toggleUserSuspension(userId, !currentStatus);
    if (result.success) {
      setUsers(users.map(u => u.id === userId ? { ...u, is_suspended: !currentStatus } : u));
    } else {
      alert(result.error);
    }
    setLoadingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input 
          type="text" 
          placeholder="Search by name or email..." 
          className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-background rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No users found</td>
                </tr>
              ) : filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium flex items-center gap-2">
                      {user.full_name}
                      {user.is_admin && <Shield className="w-3 h-3 text-primary" />}
                    </div>
                    <div className="text-muted-foreground text-xs">{user.email}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {user.is_suspended ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                        Suspended
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      disabled={loadingId === user.id}
                      className="bg-background text-foreground border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      value={user.plan || 'free'}
                      onChange={(e) => handlePlanChange(user.id, e.target.value)}
                    >
                      {plans.map(p => (
                        <option key={p.id} value={p.id} className="bg-background text-foreground">{p.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      disabled={loadingId === user.id || user.is_admin}
                      onClick={() => handleToggleSuspension(user.id, user.is_suspended)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        user.is_suspended 
                          ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20' 
                          : 'bg-red-500/10 text-red-600 hover:bg-red-500/20'
                      } ${user.is_admin ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {user.is_suspended ? (
                        <><CheckCircle2 className="w-3.5 h-3.5" /> Activate</>
                      ) : (
                        <><Ban className="w-3.5 h-3.5" /> Suspend</>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
