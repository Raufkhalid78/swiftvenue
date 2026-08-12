"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle, Calendar as CalendarIcon, MapPin, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function EventsList() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
        
      if (data) setEvents(data);
      setLoading(false);
    }
    loadEvents();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight">My Events</h1>
          <p className="text-muted-foreground mt-1">Manage all your upcoming and past events.</p>
        </div>
        <Link href="/dashboard/events/new">
          <Button className="gap-2">
            <PlusCircle className="w-4 h-4" /> Create New Event
          </Button>
        </Link>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 flex justify-center text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="p-6 sm:p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <CalendarIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No events found</h3>
            <p className="text-muted-foreground mb-6">You havent created any events yet. Let us get started!</p>
            <Link href="/dashboard/events/new">
              <Button>Create Your First Event</Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {events.map((event) => (
              <div key={event.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-lg">{event.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      event.status === 'published' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
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
