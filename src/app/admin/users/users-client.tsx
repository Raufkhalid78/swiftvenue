'use client';

import { useState, useMemo } from 'react';
import { Search, Shield, Ban, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { updateUserPlan, toggleUserSuspension } from './actions';
import { toast } from 'sonner';
import { ConfirmAction } from '@/components/confirm-action';

const PAGE_SIZE = 25;

export function UsersClient({ initialUsers, plans }: { initialUsers: any[], plans: any[] }) {
  const [allUsers, setAllUsers] = useState(initialUsers);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allUsers;
    return allUsers.filter((user) => {
      const name = (user.full_name || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      const plan = (user.plan || '').toLowerCase();
      return name.includes(q) || email.includes(q) || plan.includes(q);
    });
  }, [allUsers, search]);

  const paginatedUsers = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, page]);

  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE) || 1;

  const handlePlanChange = async (userId: string, newPlanId: string) => {
    setLoadingId(userId);
    const result = await updateUserPlan(userId, newPlanId);
    if (result.success) {
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, plan: newPlanId, plans: plans.find(p => p.id === newPlanId) } : u));
      toast.success('User plan updated');
    } else {
      toast.error(result.error || 'Failed to update user plan');
    }
    setLoadingId(null);
  };

  const handleToggleSuspension = async (userId: string, currentStatus: boolean) => {
    setLoadingId(userId);
    const result = await toggleUserSuspension(userId, !currentStatus);
    if (result.success) {
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, is_suspended: !currentStatus } : u));
      toast.success(`User ${currentStatus ? 'activated' : 'suspended'} successfully`);
    } else {
      toast.error(result.error || 'Failed to update user status');
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
        <div className="overflow-x-auto hidden sm:block">
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
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    {search ? 'No matching users found' : 'No users found'}
                  </td>
                </tr>
              ) : paginatedUsers.map((user) => (
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
                      className="bg-background text-foreground border border-border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                      value={user.plan || 'free'}
                      onChange={(e) => handlePlanChange(user.id, e.target.value)}
                    >
                      {plans.map(p => (
                        <option key={p.id} value={p.id} className="bg-background text-foreground">{p.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ConfirmAction
                      destructive={!user.is_suspended}
                      description={`Are you sure you want to ${user.is_suspended ? 'activate' : 'suspend'} this user?`}
                      onConfirm={() => handleToggleSuspension(user.id, user.is_suspended)}
                    >
                      <button
                        disabled={loadingId === user.id || user.is_admin}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
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
                    </ConfirmAction>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Cards */}
        <div className="md:hidden divide-y divide-border">
          {paginatedUsers.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              {search ? 'No matching users found' : 'No users found'}
            </div>
          ) : paginatedUsers.map((user) => (
            <div key={user.id} className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {user.full_name}
                    {user.is_admin && <Shield className="w-3 h-3 text-primary" />}
                  </div>
                  <div className="text-muted-foreground text-xs">{user.email}</div>
                </div>
                {user.is_suspended ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 uppercase tracking-wide">
                    Suspended
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 uppercase tracking-wide">
                    Active
                  </span>
                )}
              </div>
              
              <div className="flex justify-between items-center text-sm border-t border-border pt-2 mt-2">
                <div className="text-xs text-muted-foreground">
                  Joined: {new Date(user.created_at).toLocaleDateString()}
                </div>
                
                <div className="flex items-center gap-2">
                  <select
                    disabled={loadingId === user.id}
                    className="bg-background text-foreground border border-border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    value={user.plan || 'free'}
                    onChange={(e) => handlePlanChange(user.id, e.target.value)}
                  >
                    {plans.map(p => (
                      <option key={p.id} value={p.id} className="bg-background text-foreground">{p.name}</option>
                    ))}
                  </select>
                  
                  <ConfirmAction
                    destructive={!user.is_suspended}
                    description={`Are you sure you want to ${user.is_suspended ? 'activate' : 'suspend'} this user?`}
                    onConfirm={() => handleToggleSuspension(user.id, user.is_suspended)}
                  >
                    <button
                      disabled={loadingId === user.id || user.is_admin}
                      className={`inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                        user.is_suspended 
                          ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20' 
                          : 'bg-red-500/10 text-red-600 hover:bg-red-500/20'
                      } ${user.is_admin ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {user.is_suspended ? (
                        <><CheckCircle2 className="w-3.5 h-3.5" /></>
                      ) : (
                        <><Ban className="w-3.5 h-3.5" /></>
                      )}
                    </button>
                  </ConfirmAction>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Page {page + 1} of {totalPages} ({filteredUsers.length} total)
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-2 rounded-md border border-border bg-background hover:bg-muted disabled:opacity-50 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page + 1 >= totalPages}
            className="p-2 rounded-md border border-border bg-background hover:bg-muted disabled:opacity-50 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
