'use client';

import { useState, useEffect } from 'react';
import { Search, ExternalLink, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { markOrderRefunded } from './actions';
import { toast } from 'sonner';
import { ConfirmAction } from '@/components/confirm-action';
import { createClient } from '@/lib/supabase/client';

const PAGE_SIZE = 25;

export function OrdersClient({ initialOrders }: { initialOrders: any[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [count, setCount] = useState(initialOrders.length);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchOrders() {
      let query = supabase
        .from('orders')
        .select(`
          *,
          events!inner (
            title,
            slug
          )
        `, { count: 'exact' });

      if (search) {
        query = query.or(`guest_name.ilike.%${search}%,guest_email.ilike.%${search}%,id.ilike.%${search}%,events.title.ilike.%${search}%`);
      }

      const { data, count: totalCount, error } = await query
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setOrders(data);
        if (totalCount !== null) setCount(totalCount);
      }
    }

    const timer = setTimeout(() => {
      fetchOrders();
    }, 300);

    return () => clearTimeout(timer);
  }, [search, page, supabase]);

  const handleRefund = async (orderId: string) => {
    setLoadingId(orderId);
    const result = await markOrderRefunded(orderId);
    if (result.success) {
      setOrders(orders.map(o => o.id === orderId ? { ...o, refund_status: 'refunded' } : o));
      toast.success('Order marked as refunded');
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
          placeholder="Search by order ID, guest name/email, or event title..." 
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
                <th className="px-4 py-3 font-medium">Order ID</th>
                <th className="px-4 py-3 font-medium">Guest</th>
                <th className="px-4 py-3 font-medium">Event</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Refund</th>
                <th className="px-4 py-3 font-medium text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No orders found</td>
                </tr>
              ) : orders.map((order) => (
                <tr key={order.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {order.id.split('-')[0]}...
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{order.guest_name}</div>
                    <div className="text-muted-foreground text-xs">{order.guest_email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium max-w-[200px] truncate" title={order.events?.title}>
                      {order.events?.title || 'Unknown Event'}
                    </div>
                    {order.events?.slug && (
                      <Link href={`/e/${order.events.slug}`} target="_blank" className="text-primary hover:underline text-xs flex items-center gap-1">
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
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      order.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {order.refund_status === 'none' ? (
                      <span className="text-muted-foreground text-xs">—</span>
                    ) : order.refund_status === 'requested' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                        Requested
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                        Refunded
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground whitespace-nowrap space-y-2">
                    <div>{new Date(order.created_at).toLocaleDateString()}</div>
                    {order.amount > 0 && order.refund_status !== 'refunded' && (
                      <ConfirmAction
                        description="Mark this order as refunded? Ensure you have processed this chargeback/refund with Safepay first."
                        onConfirm={() => handleRefund(order.id)}
                      >
                        <button
                          disabled={loadingId === order.id}
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50"
                        >
                          <RefreshCw className="w-3 h-3" /> Mark Refunded
                        </button>
                      </ConfirmAction>
                    )}
                  </td>
                </tr>
              ))}
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

