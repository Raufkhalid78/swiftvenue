"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Menu, X, ArrowRight, LayoutDashboard, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface NavbarProps {
  initialUser?: any;
}

export function Navbar({ initialUser }: NavbarProps) {
  const [user, setUser] = useState<any>(initialUser || null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    if (initialUser !== undefined) {
      setUser(initialUser);
      return;
    }

    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    }

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [initialUser, supabase]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { name: "Explore Events", href: "/events" },
    { name: "How it Works", href: pathname === "/" ? "#how-it-works" : "/#how-it-works" },
    { name: "Features", href: pathname === "/" ? "#features" : "/#features" },
    { name: "Pricing", href: "/pricing" },
    { name: "About", href: "/about" },
    { name: "Blog", href: "/blog" },
    { name: "Contact", href: "/contact" },
  ];

  const isAdmin = user?.user_metadata?.is_admin;
  const dashboardHref = isAdmin ? "/admin" : "/dashboard";
  const dashboardLabel = isAdmin ? "Admin Panel" : "Go to Dashboard";

  return (
    <nav className="border-b border-border/40 backdrop-blur-md sticky top-0 z-50 bg-background/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <Image 
            src="/logo.jpg" 
            alt="SwiftVenue Logo" 
            width={32} 
            height={32} 
            className="w-8 h-8 rounded-lg object-cover shadow-sm border border-border/50 group-hover:scale-105 transition-transform" 
          />
          <span className="font-display font-bold text-xl tracking-tight text-foreground">
            SwiftVenue
          </span>
        </Link>

        {/* Desktop Central Navigation Links */}
        <div className="hidden lg:flex items-center gap-6 xl:gap-8 text-sm font-medium text-muted-foreground">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`transition-colors hover:text-foreground ${
                  isActive ? "text-foreground font-semibold" : ""
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>

        {/* Desktop Right Action Buttons */}
        <div className="hidden sm:flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <Link href={dashboardHref}>
              <Button className="gap-2 shadow-sm">
                {isAdmin ? <ShieldAlert className="w-4 h-4" /> : <LayoutDashboard className="w-4 h-4" />}
                {dashboardLabel}
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" className="font-medium">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="gap-1.5 shadow-sm">
                  Get Started <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Header Controls (Theme Toggle + Hamburger) */}
        <div className="flex sm:hidden items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="text-foreground"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Medium Screen Menu Trigger (between 640px and 1024px) */}
        <div className="hidden sm:flex lg:hidden items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="text-foreground ml-1"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile & Tablet Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-border bg-background/95 backdrop-blur-xl animate-in slide-in-from-top-2 duration-200">
          <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
            <div className="flex flex-col space-y-3">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2 rounded-xl text-base font-medium transition-colors ${
                      isActive 
                        ? "bg-primary/10 text-primary font-semibold" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>

            <div className="pt-4 border-t border-border/80 flex flex-col gap-2.5">
              {user ? (
                <Link href={dashboardHref} onClick={() => setMobileMenuOpen(false)} className="w-full">
                  <Button className="w-full gap-2 justify-center py-5">
                    {isAdmin ? <ShieldAlert className="w-4 h-4" /> : <LayoutDashboard className="w-4 h-4" />}
                    {dashboardLabel}
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className="w-full">
                    <Button className="w-full gap-2 justify-center py-5 shadow-sm">
                      Get Started <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="w-full">
                    <Button variant="outline" className="w-full justify-center py-5">
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
