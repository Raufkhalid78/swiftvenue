'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { approveUpgradeRequest, rejectUpgradeRequest } from './actions';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { ConfirmAction } from '@/components/confirm-action';

type RequestStatus = 'pending' | 'approved' | 'rejected';

type RequestRecord = {
  id: string;
  plan_id: string;
  reference_number: string;
  status: RequestStatus;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
  };
  plans: {
    name: string;
  };
};

export function AdminUpgradeRequestsClient({ initialRequests }: { initialRequests: RequestRecord[] }) {
  const [requests, setRequests] = useState<RequestRecord[]>(initialRequests);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setLoadingId(id);
    const result = await approveUpgradeRequest(id);
    if (result.success) {
      setRequests(prev => prev.map(req => req.id === id ? { ...req, status: 'approved' } : req));
      toast.success('Upgrade request approved');
    } else {
      toast.error(result.error || 'Failed to approve');
    }
    setLoadingId(null);
  };

  const handleReject = async (id: string) => {
    setLoadingId(id);
    const result = await rejectUpgradeRequest(id);
    if (result.success) {
      setRequests(prev => prev.map(req => req.id === id ? { ...req, status: 'rejected' } : req));
      toast.success('Upgrade request rejected');
    } else {
      toast.error(result.error || 'Failed to reject');
    }
    setLoadingId(null);
  };

  return (
    <div className="space-y-6">
      {requests.length === 0 ? (
        <div className="p-6 sm:p-12 border border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground text-center bg-card">
          <p>No upgrade requests found.</p>
        </div>
      ) : (
        <div className="border rounded-xl overflow-x-auto bg-card">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 font-medium">
              <tr>
                <th className="px-4 py-3">Organizer</th>
                <th className="px-4 py-3">Plan Requested</th>
                <th className="px-4 py-3">Reference #</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {requests.map(req => (
                <tr key={req.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{req.profiles?.full_name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">{req.profiles?.email}</p>
                  </td>
                  <td className="px-4 py-3 font-medium text-primary">
                    {req.plans?.name || req.plan_id}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {req.reference_number}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                      req.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20' :
                      req.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20' :
                      'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:border-red-500/20'
                    }`}>
                      {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {req.status === 'pending' && (
                      <div className="flex items-center justify-end gap-2">
                        <ConfirmAction
                          destructive={true}
                          description="Are you sure you want to reject this upgrade request?"
                          onConfirm={() => handleReject(req.id)}
                        >
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                            disabled={loadingId === req.id}
                          >
                            {loadingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-1" />}
                            Reject
                          </Button>
                        </ConfirmAction>
                        <ConfirmAction
                          description={`Are you sure you want to approve this upgrade to ${req.plans?.name || req.plan_id}?`}
                          onConfirm={() => handleApprove(req.id)}
                        >
                          <Button 
                            size="sm" 
                            className="h-8 bg-emerald-600 hover:bg-emerald-700"
                            disabled={loadingId === req.id}
                          >
                            {loadingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                            Approve
                          </Button>
                        </ConfirmAction>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
