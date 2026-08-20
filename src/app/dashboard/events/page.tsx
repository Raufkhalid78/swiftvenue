"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle, Calendar as CalendarIcon, MapPin, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function EventsList() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEvents() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setLoading(false);
          return;
        }

        const { data, error: fetchError } = await supabase
          .from('events')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });
          
        if (fetchError) throw fetchError;
        if (data) setEvents(data);
      } catch (err: any) {
        console.error("Error loading events:", err);
        setError(err.message || "Failed to load events. Please check your internet connection and try again.");
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, []);

  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all');

  const filteredEvents = events.filter(e => {
    if (statusFilter === 'all') return true;
    return e.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight">My Events</h1>
          <p className="text-muted-foreground mt-1">Manage all your upcoming, past, and archived events.</p>
        </div>
        <Link href="/dashboard/events/new">
          <Button className="gap-2">
            <PlusCircle className="w-4 h-4" /> Create New Event
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto">
        {(['all', 'published', 'draft', 'archived'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer ${
              statusFilter === tab
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {tab === 'all' ? `All (${events.length})` : `${tab} (${events.filter(e => e.status === tab).length})`}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 flex justify-center text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-6 sm:p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <CalendarIcon className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-destructive">Connection Error</h3>
            <p className="text-muted-foreground mb-6 max-w-md">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry Connection</Button>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-6 sm:p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <CalendarIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No {statusFilter !== 'all' ? statusFilter : ''} events found</h3>
            <p className="text-muted-foreground mb-6">
              {statusFilter === 'all' 
                ? 'You have not created any events yet. Let us get started!' 
                : `You do not have any ${statusFilter} events.`}
            </p>
            {statusFilter === 'all' && (
              <Link href="/dashboard/events/new">
                <Button>Create Your First Event</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredEvents.map((event) => (
              <div key={event.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-lg">{event.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      event.status === 'published' 
                        ? 'bg-emerald-500/10 text-emerald-600' 
                        : event.status === 'archived'
                        ? 'bg-purple-500/10 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                        : 'bg-amber-500/10 text-amber-600'
                    }`}>
                      {event.status.toUpperCase()}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium capitalize">
                      {event.type}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                    <span className="flex items-center gap-1.5"><CalendarIcon className="w-4 h-4" /> {event.date}</span>
                    <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {event.venue_name || 'No Venue'}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Link href={`/e/${event.slug}`} target="_blank">
                    <Button variant="outline" size="sm">View Public Page</Button>
                  </Link>
                  <Link href={`/dashboard/events/${event.id}`}>
                    <Button size="sm">Manage Event</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
