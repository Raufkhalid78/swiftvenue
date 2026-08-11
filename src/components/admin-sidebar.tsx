"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldAlert, Users, Calendar, LayoutDashboard, CreditCard, Banknote, RefreshCcw, ArrowUpCircle, Settings, Share2, Mail, FileText, LogOut, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

export function AdminSidebar({ email }: { email: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const toggleSidebar = () => setIsOpen(!isOpen);

  const NavContent = () => (
    <>
      <div className="h-16 flex items-center justify-between px-6 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-primary text-primary-foreground p-1.5 rounded">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <h1 className="font-semibold text-lg">SwiftVenue Admin</h1>
        </div>
        <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleSidebar}>
          <X className="w-5 h-5" />
        </Button>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {sidebarLinks.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors ${
                isActive 
                  ? 'bg-secondary text-secondary-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-border/50 shrink-0">
        <div className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground mb-2 break-all">
          <span className="truncate">{email}</span>
        </div>
        <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <LogOut className="w-4 h-4 shrink-0" />
          Exit Admin
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Header (visible only on small screens) */}
      <div className="md:hidden bg-card border-b border-border p-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground p-1 rounded">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <span className="font-semibold">SwiftVenue Admin</span>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar (Desktop fixed, Mobile off-canvas) */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border flex flex-col transform transition-transform duration-200 ease-in-out
        md:translate-x-0 md:static md:h-screen
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <NavContent />
      </aside>
    </>
  );
}
