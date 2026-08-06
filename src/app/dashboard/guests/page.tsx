"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, CheckCircle2, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export default function GlobalGuestsPage() {
  const [guests, setGuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAllGuests() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch all events for user first
      const { data: events } = await supabase
        .from('events')
        .select('id, title')
        .eq('user_id', session.user.id);

      if (!events || events.length === 0) {
        setLoading(false);
        return;
      }

      const eventIds = events.map(e => e.id);
      const eventMap = Object.fromEntries(events.map(e => [e.id, e.title]));

      // Fetch attendees for all user's events
      const { data: attendees } = await supabase
        .from('attendees')
        .select('*')
        .in('event_id', eventIds)
        .order('created_at', { ascending: false });

      if (attendees) {
        const enriched = attendees.map(a => ({
          ...a,
          event_title: eventMap[a.event_id] || 'Unknown Event'
        }));
        setGuests(enriched);
      }
      setLoading(false);
    }
    loadAllGuests();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight">All Guest Lists</h1>
          <p className="text-sm text-muted-foreground mt-1">Global view of all attendees registered across your events.</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" /> Export All CSV
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between gap-4 bg-muted/20">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search all guests by name or email..." className="pl-9 bg-background" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Guest Name</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Event</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="px-6 py-4"><Skeleton className="h-5 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-48" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                  </tr>
                ))
              ) : guests.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    No guests have registered across any of your events yet.
                  </td>
                </tr>
              ) : (
                guests.map((guest) => (
                  <tr key={guest.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{guest.guest_name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{guest.guest_email || '—'}</td>
                    <td className="px-6 py-4 font-medium text-primary">{guest.event_title}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        guest.status === 'registered' ? 'bg-amber-500/10 text-amber-600' :
                        guest.status === 'attended' ? 'bg-emerald-500/10 text-emerald-600' :
                        'bg-destructive/10 text-destructive'
                      }`}>
                        {guest.status === 'registered' && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                        {guest.status === 'attended' && <CheckCircle2 className="w-3 h-3" />}
                        {guest.status === 'cancelled' && <XCircle className="w-3 h-3" />}
                        {guest.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
