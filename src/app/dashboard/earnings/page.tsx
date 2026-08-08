import { createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ArrowUpRight, Wallet, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata = {
  title: "Earnings & Payouts - SwiftVenue",
};

export default async function EarningsPage() {
  const service = createServiceClient();
  const { data: { user }, error: authErr } = await service.auth.getUser();

  if (authErr || !user) {
    redirect("/login");
  }

  // Fetch all orders for this organizer to calculate earnings
  const { data: events } = await service
    .from('events')
    .select('id')
    .eq('user_id', user.id);

  const eventIds = events?.map(e => e.id) || [];
  
  let orders: any[] = [];
  if (eventIds.length > 0) {
    const { data: fetchedOrders } = await service
      .from('orders')
      .select('id, amount, organizer_net_amount, status, created_at')
      .in('event_id', eventIds)
      .eq('status', 'paid');
    if (fetchedOrders) {
      orders = fetchedOrders;
    }
  }

  // Calculate totals
  const totalSales = orders.reduce((sum, order) => sum + Number(order.amount), 0);
  const totalNet = orders.reduce((sum, order) => sum + Number(order.organizer_net_amount || 0), 0);

  // Fetch payouts
  const { data: payouts } = await service
    .from('payouts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const totalPaidOut = (payouts || [])
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const pendingBalance = totalNet - totalPaidOut;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Earnings</h1>
          <p className="text-muted-foreground mt-1">Track your ticket sales revenue and payouts.</p>
        </div>
        <Button asChild variant="outline" className="gap-2 shrink-0">
          <Link href="/dashboard/settings">
            <Wallet className="w-4 h-4" /> Manage Payout Settings
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-emerald-950/10 border-emerald/20 shadow-sm relative overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-emerald tracking-wide uppercase">Available Balance</p>
              <div className="h-10 w-10 rounded-xl bg-emerald/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-foreground">Rs {pendingBalance.toLocaleString()}</h3>
            <p className="text-sm text-muted-foreground mt-2">Next automated payout on Friday</p>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Total Net Revenue</p>
              <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-foreground">Rs {totalNet.toLocaleString()}</h3>
            <p className="text-sm text-muted-foreground mt-2">After platform fees</p>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Total Withdrawn</p>
              <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                <History className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-foreground">Rs {totalPaidOut.toLocaleString()}</h3>
            <p className="text-sm text-muted-foreground mt-2">Successfully processed</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border shadow-sm">
        <div className="p-6 border-b border-border">
          <h3 className="text-xl font-bold font-display">Payout History</h3>
        </div>
        <div className="p-0">
          {!payouts || payouts.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <p>No payouts have been processed yet.</p>
              <p className="text-sm mt-1">Payouts are generated automatically when you have a positive balance.</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/30 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-semibold text-muted-foreground">Date</th>
                  <th className="px-6 py-4 font-semibold text-muted-foreground">Amount</th>
                  <th className="px-6 py-4 font-semibold text-muted-foreground text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payouts.map(payout => (
                  <tr key={payout.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 text-foreground">
                      {new Date(payout.created_at).toLocaleDateString('en-PK', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 font-bold text-foreground">Rs {Number(payout.amount).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-wider capitalize
                        ${payout.status === 'paid' ? 'bg-emerald/10 text-emerald' : 
                          payout.status === 'processing' ? 'bg-blue-500/10 text-blue-500' :
                          'bg-amber-500/10 text-amber-500'}`}
                      >
                        {payout.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
