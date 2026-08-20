'use client';

import { useState, useMemo } from 'react';
import { Search, ExternalLink, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { markOrderRefunded } from './actions';
import { toast } from 'sonner';
import { ConfirmAction } from '@/components/confirm-action';

const PAGE_SIZE = 25;

export function OrdersClient({ initialOrders }: { initialOrders: any[] }) {
  const [allOrders, setAllOrders] = useState(initialOrders);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allOrders;
    return allOrders.filter((order) => {
      const event = Array.isArray(order.events) ? order.events[0] : order.events;
      const guestName = (order.guest_name || '').toLowerCase();
      const guestEmail = (order.guest_email || '').toLowerCase();
      const orderId = (order.id || '').toLowerCase();
      const eventTitle = (event?.title || '').toLowerCase();
      return guestName.includes(q) || guestEmail.includes(q) || orderId.includes(q) || eventTitle.includes(q);
    });
  }, [allOrders, search]);

  const paginatedOrders = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filteredOrders.slice(start, start + PAGE_SIZE);
  }, [filteredOrders, page]);

  const totalPages = Math.ceil(filteredOrders.length / PAGE_SIZE) || 1;

  const handleRefund = async (orderId: string) => {
    setLoadingId(orderId);
    const result = await markOrderRefunded(orderId);
    if (result.success) {
      setAllOrders(prev => prev.map(o => o.id === orderId ? { ...o, refund_status: 'refunded' } : o));
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
          placeholder="Search by order ID, guest name/email, or event title..." 
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
                <th className="px-4 py-3 font-medium">Order ID</th>
                <th className="px-4 py-3 font-medium">Guest</th>
                <th className="px-4 py-3 font-medium">Event</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    {search ? 'No matching orders found' : 'No orders found'}
                  </td>
                </tr>
              ) : paginatedOrders.map((order) => {
                const event = Array.isArray(order.events) ? order.events[0] : order.events;
                return (
                  <tr key={order.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {order.id.split('-')[0]}...
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{order.guest_name}</div>
                      <div className="text-muted-foreground text-xs">{order.guest_email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium max-w-[200px] truncate" title={event?.title}>
                        {event?.title || 'Unknown Event'}
                      </div>
                      {event?.slug && (
                        <Link href={`/e/${event.slug}`} target="_blank" className="text-primary hover:underline text-xs flex items-center gap-1">
                          View Event <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {order.amount == 0 ? 'Free' : `${order.currency} ${Number(order.amount).toLocaleString()}`}
                      </div>
                      {order.amount > 0 && (
                        <div className="text-muted-foreground text-xs flex gap-2">
                          <span title="Organizer Net" className="text-green-600">Net: {Number(order.organizer_net_amount || 0).toLocaleString()}</span>
                          <span title="Platform Fee" className="text-blue-600">Fee: {Number(order.platform_fee_amount || 0).toLocaleString()}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 capitalize text-muted-foreground text-xs">
                      {order.payment_method || 'Online'}
                    </td>
                    <td className="px-4 py-3">
                      {order.status === 'paid' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                          {order.status}
                        </span>
                      )}
                      {order.refund_status !== 'none' && (
                        <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide ${
                          order.refund_status === 'requested' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                          'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                        }`}>
                          {order.refund_status}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {order.amount > 0 && order.refund_status !== 'refunded' && (
                        <ConfirmAction
                          description="Mark this order as refunded? Ensure you have processed this chargeback/refund with Safepay first."
                          onConfirm={() => handleRefund(order.id)}
                        >
                          <button
                            disabled={loadingId === order.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50 border border-border cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> Mark Refunded
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

        {/* Mobile View: Cards */}
        <div className="md:hidden divide-y divide-border">
          {paginatedOrders.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              {search ? 'No matching orders found' : 'No orders found'}
            </div>
          ) : paginatedOrders.map((order) => {
            const event = Array.isArray(order.events) ? order.events[0] : order.events;
            return (
              <div key={order.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{order.guest_name}</div>
                    <div className="text-muted-foreground text-xs">{order.guest_email}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {order.status === 'paid' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 uppercase tracking-wide">
                        Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 uppercase tracking-wide">
                        {order.status}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  <div className="font-medium text-foreground">{event?.title || 'Unknown Event'}</div>
                  {event?.slug && (
                    <Link href={`/e/${event.slug}`} target="_blank" className="text-primary hover:underline text-xs flex items-center gap-1 mt-1">
                      View Event <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>
                
                <div className="flex justify-between items-end pt-1">
                  <div>
                    <div className="font-bold text-base">
                      {order.amount == 0 ? 'Free' : `${order.currency} ${Number(order.amount).toLocaleString()}`}
                    </div>
                    <div className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    {order.refund_status !== 'none' && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide ${
                        order.refund_status === 'requested' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                        'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                      }`}>
                        {order.refund_status}
                      </span>
                    )}
                    {order.amount > 0 && order.refund_status !== 'refunded' && (
                      <ConfirmAction
                        description="Mark this order as refunded? Ensure you have processed this chargeback/refund with Safepay first."
                        onConfirm={() => handleRefund(order.id)}
                      >
                        <button
                          disabled={loadingId === order.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50 border border-border cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" /> Mark Refunded
                        </button>
                      </ConfirmAction>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Page {page + 1} of {totalPages} ({filteredOrders.length} total)
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
