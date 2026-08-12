'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Banknote, TrendingUp, HandCoins, Activity } from 'lucide-react';

interface Props {
  grossTicketingVolume: number;
  ticketingProfit: number;
  organizerLiabilities: number;
  subscriptionProfit: number;
  totalPlatformProfit: number;
}

export function AccountsClient({
  grossTicketingVolume,
  ticketingProfit,
  organizerLiabilities,
  subscriptionProfit,
  totalPlatformProfit,
}: Props) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* Primary Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Ticketing Volume</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display">{formatCurrency(grossTicketingVolume)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total money processed via tickets
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-emerald-50 dark:bg-emerald-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800 dark:text-emerald-400">Total Platform Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display text-emerald-700 dark:text-emerald-300">
              {formatCurrency(totalPlatformProfit)}
            </div>
            <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1">
              Ticketing + Subscriptions
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizer Liabilities</CardTitle>
            <HandCoins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display">{formatCurrency(organizerLiabilities)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Money owed to organizers
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscription Revenue</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display">{formatCurrency(subscriptionProfit)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              From approved Pro upgrades
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="font-display">Platform Revenue Split</CardTitle>
            <CardDescription>Breakdown of SwiftVenue's profit sources.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="font-medium">Ticketing Fees</span>
                  </div>
                  <span className="font-bold">{formatCurrency(ticketingProfit)}</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full" 
                    style={{ width: `${totalPlatformProfit > 0 ? (ticketingProfit / totalPlatformProfit) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500" />
                    <span className="font-medium">Subscription Upgrades</span>
                  </div>
                  <span className="font-bold">{formatCurrency(subscriptionProfit)}</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 rounded-full" 
                    style={{ width: `${totalPlatformProfit > 0 ? (subscriptionProfit / totalPlatformProfit) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="font-display">Ticketing Volume Breakdown</CardTitle>
            <CardDescription>Where does the ticket money go?</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="font-medium">Platform Take (Fees)</span>
                  </div>
                  <span className="font-bold">{formatCurrency(ticketingProfit)}</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full" 
                    style={{ width: `${grossTicketingVolume > 0 ? (ticketingProfit / grossTicketingVolume) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="font-medium">Organizer Liabilities (Payouts)</span>
                  </div>
                  <span className="font-bold">{formatCurrency(organizerLiabilities)}</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 rounded-full" 
                    style={{ width: `${grossTicketingVolume > 0 ? (organizerLiabilities / grossTicketingVolume) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
