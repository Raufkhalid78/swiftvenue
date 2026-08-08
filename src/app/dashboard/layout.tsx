"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { LayoutDashboard, Calendar, Users, Settings, LogOut, Menu, DollarSign, CreditCard } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const navItems = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "My Events", href: "/dashboard/events", icon: Calendar },
    { name: "Guest Lists", href: "/dashboard/guests", icon: Users },
    { name: "Earnings", href: "/dashboard/earnings", icon: DollarSign },
    { name: "Billing & Plans", href: "/dashboard/billing", icon: CreditCard },
  ];

  const SidebarContent = () => (
    <>
      <div className="h-16 flex items-center px-6 border-b border-border/50 shrink-0">
        <Link href="/" className="flex items-center">
          <div className="w-6 h-6 rounded bg-primary flex items-center justify-center mr-2">
            <span className="text-primary-foreground font-bold text-xs font-display">S</span>
          </div>
          <span className="font-display font-semibold tracking-tight">SwiftVenue</span>
        </Link>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link 
              key={item.name}
              href={item.href} 
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors ${
                isActive 
                  ? "bg-secondary text-secondary-foreground" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" /> {item.name}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-border/50 shrink-0">
        <Link 
          href="/dashboard/settings" 
          onClick={() => setMobileMenuOpen(false)}
          className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors mb-2 ${
            pathname.startsWith("/dashboard/settings") 
              ? "bg-secondary text-secondary-foreground" 
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Settings className="w-4 h-4" /> Settings
        </Link>
        <button 
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-destructive hover:bg-destructive/10 font-medium text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Desktop Sidebar */}
      <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <aside className="relative w-64 max-w-[80%] h-full bg-card border-r border-border flex flex-col shadow-xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
            <h2 className="font-semibold text-foreground hidden sm:block">Dashboard</h2>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <span className="text-xs font-medium text-primary">ME</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
