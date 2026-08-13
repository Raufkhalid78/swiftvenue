'use client';

import { useState, useEffect } from 'react';
import { Search, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { processPayout } from './actions';
import Link from 'next/link';
import { toast } from 'sonner';
import { ConfirmAction } from '@/components/confirm-action';
import { createClient } from '@/lib/supabase/client';

const PAGE_SIZE = 25;

export function PayoutsClient({ initialPayouts }: { initialPayouts: any[] }) {
  const [payouts, setPayouts] = useState(initialPayouts);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [count, setCount] = useState(initialPayouts.length);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchPayouts() {
      let query = supabase
        .from('payouts')
        .select(`
          *,
          profiles!inner (
            full_name,
            email
          )
        `, { count: 'exact' });

      if (search) {
        query = query.or(`profiles.email.ilike.%${search}%,profiles.full_name.ilike.%${search}%`);
      }

      const { data, count: totalCount, error } = await query
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setPayouts(data);
        if (totalCount !== null) setCount(totalCount);
      }
    }

    const timer = setTimeout(() => {
      fetchPayouts();
    }, 300);

    return () => clearTimeout(timer);
  }, [search, page, supabase]);

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
              {payouts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No pending payouts found</td>
                </tr>
              ) : payouts.map((payout) => {
                const totalOrders = payout.orders?.[0]?.count || payout.order_ids?.length || 0;
                
                return (
                  <tr key={payout.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium max-w-[200px] truncate" title={payout.title}>
                        {payout.type === 'request' || payout.type === undefined ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                            Payout Request
                          </span>
                        ) : payout.title}
                      </div>
                      {payout.slug && (
                        <Link href={`/e/${payout.slug}`} target="_blank" className="text-primary hover:underline text-xs block">
                          View Event
                        </Link>
                      )}
                      <div className="text-muted-foreground text-xs mt-1">
                        {payout.type === 'request' || payout.type === undefined ? `Requested: ${new Date(payout.created_at || payout.date).toLocaleDateString('en-PK')}` : `Ended: ${payout.date}`}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{payout.profiles?.full_name}</div>
                      <div className="text-muted-foreground text-xs">{payout.profiles?.email}</div>
                      <div className="mt-2 text-xs p-2 bg-muted rounded border border-border">
                        {payout.payout_method ? (
                          <div>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary uppercase tracking-wider mb-1">
                              {payout.payout_method.method}
                            </span>
                            <pre className="font-mono text-[10px] whitespace-pre-wrap text-foreground/80">
                              {payout.payout_method.account_details?.text || JSON.stringify(payout.payout_method.account_details, null, 2)}
                            </pre>
                          </div>
                        ) : (
                          <span className="text-red-500 font-medium">No bank details provided</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-lg text-green-600">
                        Rs. {Number(payout.amount || payout.total_payout).toLocaleString()}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        From {totalOrders} paid tickets
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {payout.status === 'paid' || payout.payout_status === 'paid' ? (
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
                      {payout.status !== 'paid' && payout.payout_status !== 'paid' && (payout.amount > 0 || payout.total_payout > 0) && (
                        <ConfirmAction
                          description="Mark this payout as processed? Ensure you have transferred the funds to the organizer."
                          onConfirm={() => handleProcess(payout.id)}
                        >
                          <button
                            disabled={loadingId === payout.id || (!payout.profiles?.bank_details && !payout.payout_method)}
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

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Page {page + 1} of {Math.ceil(count / PAGE_SIZE) || 1}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-2 rounded-md border border-border bg-background hover:bg-muted disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={(page + 1) * PAGE_SIZE >= count}
            className="p-2 rounded-md border border-border bg-background hover:bg-muted disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

