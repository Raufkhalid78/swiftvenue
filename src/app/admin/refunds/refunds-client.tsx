'use client';

import { useState, useMemo } from 'react';
import { Search, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { markOrderRefunded } from '../orders/actions';
import Link from 'next/link';
import { toast } from 'sonner';
import { ConfirmAction } from '@/components/confirm-action';

const PAGE_SIZE = 25;

export function RefundsClient({ initialRefunds }: { initialRefunds: any[] }) {
  const [allRefunds, setAllRefunds] = useState(initialRefunds);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filteredRefunds = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allRefunds;
    return allRefunds.filter((refund) => {
      const event = Array.isArray(refund.events) ? refund.events[0] : refund.events;
      const orderId = (refund.id || '').toLowerCase();
      const guestName = (refund.guest_name || '').toLowerCase();
      const guestEmail = (refund.guest_email || '').toLowerCase();
      const eventTitle = (event?.title || '').toLowerCase();
      return orderId.includes(q) || guestName.includes(q) || guestEmail.includes(q) || eventTitle.includes(q);
    });
  }, [allRefunds, search]);

  const paginatedRefunds = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filteredRefunds.slice(start, start + PAGE_SIZE);
  }, [filteredRefunds, page]);

  const totalPages = Math.ceil(filteredRefunds.length / PAGE_SIZE) || 1;

  const handleProcess = async (id: string) => {
    setLoadingId(id);
    const result = await markOrderRefunded(id);
    if (result.success) {
      setAllRefunds(refs => refs.map(r => r.id === id ? { ...r, refund_status: 'refunded' } : r));
      toast.success('Order marked as refunded');
    } else {
      toast.error(result.error || 'Failed to refund order');
    }
    setLoadingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input 
          type="text" 
          placeholder="Search by order ID, guest name/email, or event..." 
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
                <th className="px-4 py-3 font-medium">Order ID / Date</th>
                <th className="px-4 py-3 font-medium">Event</th>
                <th className="px-4 py-3 font-medium">Guest Details</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedRefunds.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    {search ? 'No matching refund requests found' : 'No refund requests found'}
                  </td>
                </tr>
              ) : paginatedRefunds.map((refund) => {
                const event = Array.isArray(refund.events) ? refund.events[0] : refund.events;
                return (
                  <tr key={refund.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs">{refund.id}</div>
                      <div className="text-muted-foreground text-[10px] mt-1">
                        {new Date(refund.created_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium max-w-[200px] truncate" title={event?.title}>
                        {event?.title || 'Unknown Event'}
                      </div>
                      {event?.slug && (
                        <Link href={`/e/${event.slug}`} target="_blank" className="text-primary hover:underline text-[10px] block mt-0.5">
                          View Event
                        </Link>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{refund.guest_name}</div>
                      <div className="text-muted-foreground text-xs">{refund.guest_email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold">Rs {Number(refund.amount).toLocaleString()}</div>
                      <div className="text-muted-foreground text-[10px] uppercase">{refund.currency}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize
                        ${refund.refund_status === 'requested' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'}`}
                      >
                        {refund.refund_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {refund.refund_status === 'requested' && (
                        <ConfirmAction
                          description="Mark this order as refunded? Make sure you have processed the refund via the payment gateway first."
                          onConfirm={() => handleProcess(refund.id)}
                        >
                          <button
                            disabled={loadingId === refund.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Mark Refunded
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
          Page {page + 1} of {totalPages} ({filteredRefunds.length} total)
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

