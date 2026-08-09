"use client";

import Link from "next/link";
import { useState, useEffect, use } from "react";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarDays, Users, Settings, ArrowLeft, Shield, Image as ImageIcon, Mic2, Briefcase, HelpCircle, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function EventDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const pathname = usePathname();
  
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;
  const [slug, setSlug] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSlug() {
      const supabase = createClient();
      const { data } = await supabase.from('events').select('slug').eq('id', eventId).single();
      if (data) setSlug(data.slug);
    }
    fetchSlug();
  }, [eventId]);

  const navigation = [
    { name: "Overview", href: `/dashboard/events/${eventId}`, icon: LayoutDashboard },
    { name: "Agenda", href: `/dashboard/events/${eventId}/agenda`, icon: CalendarDays },
    { name: "Gallery", href: `/dashboard/events/${eventId}/gallery`, icon: ImageIcon },
    { name: "Speakers", href: `/dashboard/events/${eventId}/speakers`, icon: Mic2 },
    { name: "Sponsors", href: `/dashboard/events/${eventId}/sponsors`, icon: Briefcase },
    { name: "FAQ", href: `/dashboard/events/${eventId}/faq`, icon: HelpCircle },
    { name: "Updates", href: `/dashboard/events/${eventId}/updates`, icon: Megaphone },
    { name: "Guests", href: `/dashboard/events/${eventId}/guests`, icon: Users },
    { name: "Team", href: `/dashboard/events/${eventId}/team`, icon: Shield },
    { name: "Settings", href: `/dashboard/events/${eventId}/settings`, icon: Settings },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/events">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-display tracking-tight">Event Management</h1>
            <p className="text-sm text-muted-foreground">Manage your event details, schedule, and attendees.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href={slug ? `/e/${slug}` : "#"} target={slug ? "_blank" : undefined}>
            <Button variant="outline" disabled={!slug}>Preview Public Page</Button>
          </Link>
          <Button onClick={async () => {
            const supabase = createClient();
            const { error } = await supabase.from('events').update({ status: 'published' }).eq('id', eventId);
            if (error) {
              toast.error("Failed to publish event.");
            } else {
              toast.success("Event published successfully!");
              window.location.reload();
            }
          }}>Publish Event</Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-border">
        <nav className="flex space-x-8" aria-label="Tabs">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 text-sm font-medium transition-colors
                  ${isActive 
                    ? "border-primary text-primary" 
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="pt-4">
        {children}
      </div>
    </div>
  );
}
