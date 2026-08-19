"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle, Calendar, Users, CheckCircle2, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardOverview() {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Organizer");
  const [stats, setStats] = useState({ totalEvents: 0, publishedEvents: 0, totalAttendees: 0 });
  const [recentEvents, setRecentEvents] = useState<any[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch profile and events in parallel
      const [{ data: profile }, { data: events }] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('id', session.user.id).single(),
        supabase.from('events').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false })
      ]);

      if (profile?.full_name) {
        setUserName(profile.full_name.split(' ')[0]);
      }

      if (events) {
        setRecentEvents(events.slice(0, 5));
        const total = events.length;
        const published = events.filter(e => e.status === 'published').length;

        // Attendees count
        const eventIds = events.map(e => e.id);
        let attendeesCount = 0;
        if (eventIds.length > 0) {
          const { count } = await supabase
            .from('attendees')
            .select('*', { count: 'exact', head: true })
            .in('event_id', eventIds);
          attendeesCount = count || 0;
        }

        setStats({
          totalEvents: total,
          publishedEvents: published,
          totalAttendees: attendeesCount,
        });
      }
      setLoading(false);
    }
    loadDashboardData();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight">Welcome back, {userName}!</h1>
          <p className="text-muted-foreground">Here is what is happening with your events today.</p>
        </div>
        <Link href="/dashboard/events/new">
          <Button className="gap-2">
            <PlusCircle className="w-4 h-4" />
            Create Event
          </Button>
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl border border-border bg-card shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Events</p>
            {loading ? <Skeleton className="h-8 w-16" /> : <h3 className="text-3xl font-bold">{stats.totalEvents}</h3>}
          </div>
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 rounded-xl border border-border bg-card shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Published & Live</p>
            {loading ? <Skeleton className="h-8 w-16" /> : <h3 className="text-3xl font-bold text-emerald-600">{stats.publishedEvents}</h3>}
          </div>
          <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 rounded-xl border border-border bg-card shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Total RSVPs</p>
            {loading ? <Skeleton className="h-8 w-16" /> : <h3 className="text-3xl font-bold">{stats.totalAttendees}</h3>}
          </div>
          <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-600">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-lg font-display">Recent Events</h3>
          <Link href="/dashboard/events" className="text-sm text-primary hover:underline flex items-center gap-1 font-medium">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : recentEvents.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <p className="mb-4">You have not created any events yet.</p>
            <Link href="/dashboard/events/new">
              <Button variant="outline">Create Your First Event</Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentEvents.map((event) => (
              <div key={event.id} className="p-4 px-6 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div>
                  <p className="font-medium">{event.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full capitalize">{event.type}</span>
                    <span className="text-xs text-muted-foreground">{event.date}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      event.status === 'published' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                    }`}>
                      {event.status}
                    </span>
                  </div>
                </div>
                <Link href={`/dashboard/events/${event.id}`}>
                  <Button variant="ghost" size="sm">Manage</Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
