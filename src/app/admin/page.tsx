import { createServiceClient } from '@/lib/supabase/server';
import { Users, Calendar, Banknote, ArrowUpCircle } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: "Admin Dashboard | SwiftVenue Admin",
};

export default async function AdminDashboardPage() {
  const service = createServiceClient();
  
  // Fetch basic KPIs in parallel
  const [
    { count: usersCount },
    { count: eventsCount },
    { data: ordersData },
    { count: upgradesCount }
  ] = await Promise.all([
    service.from('profiles').select('*', { count: 'exact', head: true }),
    service.from('events').select('*', { count: 'exact', head: true }),
    service.from('orders').select('amount').eq('status', 'paid'),
    service.from('upgrade_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending')
  ]);

  const totalRevenue = (ordersData || []).reduce((acc, order) => acc + (Number(order.amount) || 0), 0);

  const stats = [
    {
      name: 'Total Revenue',
      value: `Rs. ${totalRevenue.toLocaleString()}`,
      icon: Banknote,
      href: '/admin/orders',
      color: 'text-green-500',
      bg: 'bg-green-500/10'
    },
    {
      name: 'Total Users',
      value: usersCount || 0,
      icon: Users,
      href: '/admin/users',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      name: 'Total Events',
      value: eventsCount || 0,
      icon: Calendar,
      href: '/admin/events',
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    },
    {
      name: 'Pending Upgrades',
      value: upgradesCount || 0,
      icon: ArrowUpCircle,
      href: '/admin/upgrade-requests',
      color: 'text-orange-500',
      bg: 'bg-orange-500/10'
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Platform Dashboard</h2>
        <p className="text-muted-foreground">High-level overview of SwiftVenue performance.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.name} href={stat.href} className="block group">
              <div className="bg-background rounded-xl p-6 border border-border shadow-sm hover:border-primary/50 transition-colors h-full">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3 rounded-lg ${stat.bg}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <h3 className="font-medium text-muted-foreground">{stat.name}</h3>
                </div>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
            </Link>
          );
        })}
      </div>
      
      <div className="bg-background rounded-xl p-6 border border-border shadow-sm mt-8">
        <h3 className="font-semibold text-lg mb-4">Quick Actions</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/admin/upgrade-requests" className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-muted transition-colors">
            <ArrowUpCircle className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium">Review Upgrades</span>
          </Link>
          <Link href="/admin/users" className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-muted transition-colors">
            <Users className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium">Manage Users</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
