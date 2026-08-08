import { createServiceClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ShieldAlert, Users, Calendar, LayoutDashboard, CreditCard, Banknote, RefreshCcw, ArrowUpCircle, Settings, Share2, Mail, FileText, LogOut } from 'lucide-react';
import Link from 'next/link';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const service = createServiceClient();
  
  // Verify admin status
  const { data: admin } = await service
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!admin?.is_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">You do not have permission to view this page. This area is restricted to administrators.</p>
          <Link href="/dashboard" className="text-primary hover:underline block mt-4">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const sidebarLinks = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Events', href: '/admin/events', icon: Calendar },
    { name: 'Orders', href: '/admin/orders', icon: CreditCard },
    { name: 'Payouts', href: '/admin/payouts', icon: Banknote },
    { name: 'Refunds', href: '/admin/refunds', icon: RefreshCcw },
    { name: 'Upgrade Requests', href: '/admin/upgrade-requests', icon: ArrowUpCircle },
    { name: 'Plans', href: '/admin/plans', icon: Settings },
    { name: 'Affiliates', href: '/admin/affiliates', icon: Share2 },
    { name: 'Messages', href: '/admin/messages', icon: Mail },
    { name: 'Audit Log', href: '/admin/audit-log', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-background border-r border-border flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-border flex items-center gap-3">
          <div className="bg-primary text-primary-foreground p-1.5 rounded">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <h1 className="font-semibold text-lg">SwiftVenue Admin</h1>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {sidebarLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground mb-4 break-all">
            <span className="truncate">{user.email}</span>
          </div>
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <LogOut className="w-4 h-4 shrink-0" />
            Exit Admin
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
