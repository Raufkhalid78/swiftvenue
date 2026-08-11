'use client';

import { useState } from 'react';
import { Search, CheckCircle2 } from 'lucide-react';
import { processPayout } from './actions';
import Link from 'next/link';
import { toast } from 'sonner';
import { ConfirmAction } from '@/components/confirm-action';

export function PayoutsClient({ initialPayouts }: { initialPayouts: any[] }) {
  const [payouts, setPayouts] = useState(initialPayouts);
  const [search, setSearch] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filteredPayouts = payouts.filter(p => 
    p.title?.toLowerCase().includes(search.toLowerCase()) || 
    p.profiles?.email?.toLowerCase().includes(search.toLowerCase()) ||
    p.profiles?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleProcess = async (eventId: string) => {
    setLoadingId(eventId);
    const result = await processPayout(eventId);
    if (result.success) {
      setPayouts(payouts.map(p => p.id === eventId ? { ...p, payout_status: 'paid' } : p));
      toast.success('Payout marked as processed');
    } else {
      toast.error(result.error);
    }
    setLoadingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input 
          type="text" 
          placeholder="Search by event title or organizer..." 
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
                <th className="px-4 py-3 font-medium">Event</th>
                <th className="px-4 py-3 font-medium">Organizer / Bank Details</th>
                <th className="px-4 py-3 font-medium">Payout Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredPayouts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No pending payouts found</td>
                </tr>
              ) : filteredPayouts.map((payout) => {
                const totalOrders = payout.orders?.[0]?.count || 0;
                
                return (
                  <tr key={payout.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium max-w-[200px] truncate" title={payout.title}>
                        {payout.title}
                      </div>
                      <Link href={`/e/${payout.slug}`} target="_blank" className="text-primary hover:underline text-xs block">
                        View Event
                      </Link>
                      <div className="text-muted-foreground text-xs mt-1">Ended: {payout.date}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{payout.profiles?.full_name}</div>
                      <div className="text-muted-foreground text-xs">{payout.profiles?.email}</div>
                      <div className="mt-2 text-xs p-2 bg-muted rounded border border-border">
                        {payout.profiles?.bank_details ? (
                          <pre className="font-mono text-[10px] whitespace-pre-wrap">{JSON.stringify(payout.profiles.bank_details, null, 2)}</pre>
                        ) : (
                          <span className="text-red-500 font-medium">No bank details provided</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-lg text-green-600">
                        Rs. {Number(payout.total_payout).toLocaleString()}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        From {totalOrders} paid tickets
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {payout.payout_status === 'paid' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {payout.payout_status !== 'paid' && payout.total_payout > 0 && (
                        <ConfirmAction
                          description="Mark this payout as processed? Ensure you have transferred the funds to the organizer."
                          onConfirm={() => handleProcess(payout.id)}
                        >
                          <button
                            disabled={loadingId === payout.id || !payout.profiles?.bank_details}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Mark Processed
                          </button>
                        </ConfirmAction>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

