'use client';

import { useState } from 'react';
import { processAffiliateApplication, processCommission } from './actions';
import { CheckCircle2, XCircle, DollarSign } from 'lucide-react';

export function AffiliatesClient({ 
  initialApplications, 
  initialCommissions 
}: { 
  initialApplications: any[];
  initialCommissions: any[];
}) {
  const [applications, setApplications] = useState(initialApplications);
  const [commissions, setCommissions] = useState(initialCommissions);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setLoadingId(id);
    const res = await processAffiliateApplication(id, 'approved');
    if (res.success) {
      setApplications(apps => apps.map(a => a.id === id ? { ...a, status: 'approved' } : a));
    } else {
      alert(res.error);
    }
    setLoadingId(null);
  };

  const handleReject = async (id: string) => {
    setLoadingId(id);
    const res = await processAffiliateApplication(id, 'rejected');
    if (res.success) {
      setApplications(apps => apps.map(a => a.id === id ? { ...a, status: 'rejected' } : a));
    } else {
      alert(res.error);
    }
    setLoadingId(null);
  };

  const handleProcessCommission = async (id: string) => {
    if (!confirm('Mark this commission as paid? Ensure you have sent the funds.')) return;
    setLoadingId(id);
    const res = await processCommission(id);
    if (res.success) {
      setCommissions(comms => comms.map(c => c.id === id ? { ...c, status: 'paid' } : c));
    } else {
      alert(res.error);
    }
    setLoadingId(null);
  };

  return (
    <div className="space-y-12">
      {/* Applications Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold font-display">Pending Applications</h3>
        <div className="bg-background rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Applicant</th>
                  <th className="px-4 py-3 font-medium">Platform / Audience</th>
                  <th className="px-4 py-3 font-medium">Payout Details</th>
                  <th className="px-4 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {applications.filter(a => a.status === 'pending').length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No pending applications</td>
                  </tr>
                ) : applications.filter(a => a.status === 'pending').map((app) => (
                  <tr key={app.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium">{app.name}</div>
                      <div className="text-muted-foreground text-xs">{app.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <a href={app.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">{app.website}</a>
                      </div>
                      <div className="text-muted-foreground text-xs mt-1">Audience: {app.audience}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs max-w-xs truncate" title={app.payout_details}>{app.payout_details || 'Not provided'}</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          disabled={loadingId === app.id}
                          onClick={() => handleApprove(app.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-green-500/10 text-green-700 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          disabled={loadingId === app.id}
                          onClick={() => handleReject(app.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-red-500/10 text-red-700 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Commissions Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold font-display">Pending Commissions</h3>
        <div className="bg-background rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Affiliate</th>
                  <th className="px-4 py-3 font-medium">Order Reference</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {commissions.filter(c => c.status === 'cleared' || c.status === 'pending').length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No pending commissions</td>
                  </tr>
                ) : commissions.filter(c => c.status === 'cleared' || c.status === 'pending').map((comm) => (
                  <tr key={comm.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium">{comm.profiles?.full_name || 'Unknown'}</div>
                      <div className="text-muted-foreground text-xs">{comm.profiles?.email}</div>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                      {comm.order_id}
                    </td>
                    <td className="px-4 py-3 font-bold text-green-600">
                      Rs {Number(comm.commission_amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        disabled={loadingId === comm.id}
                        onClick={() => handleProcessCommission(comm.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        <DollarSign className="w-3.5 h-3.5" /> Mark Paid
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
