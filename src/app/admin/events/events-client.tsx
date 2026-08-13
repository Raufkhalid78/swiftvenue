'use client';

import { useState, useEffect } from 'react';
import { Search, Trash2, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { deleteEvent } from './actions';
import Link from 'next/link';
import { toast } from 'sonner';
import { ConfirmAction } from '@/components/confirm-action';
import { createClient } from '@/lib/supabase/client';

const PAGE_SIZE = 25;

export function EventsClient({ initialEvents }: { initialEvents: any[] }) {
  const [events, setEvents] = useState(initialEvents);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [count, setCount] = useState(initialEvents.length);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchEvents() {
      let query = supabase
        .from('events')
        .select(`
          id,
          title,
          slug,
          type,
          date,
          time,
          status,
          created_at,
          profiles!inner (
            full_name,
            email
          )
        `, { count: 'exact' });

      if (search) {
        query = query.or(`title.ilike.%${search}%,profiles.email.ilike.%${search}%`);
      }

      const { data, count: totalCount, error } = await query
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setEvents(data);
        if (totalCount !== null) setCount(totalCount);
      }
    }

    const timer = setTimeout(() => {
      fetchEvents();
    }, 300);

    return () => clearTimeout(timer);
  }, [search, page, supabase]);

  const handleDelete = async (eventId: string) => {
    setLoadingId(eventId);
    const result = await deleteEvent(eventId);
    if (result.success) {
      setEvents(events.filter(e => e.id !== eventId));
      toast.success('Event deleted');
    } else {
      toast.error(result.error);
    }
    setLoadingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input 
          type="text" 
          placeholder="Search by event title or organizer email..." 
          className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-background rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Event</th>
                <th className="px-4 py-3 font-medium">Organizer</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No events found</td>
                </tr>
              ) : events.map((event) => (
                <tr key={event.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium">{event.title}</div>
                    <div className="text-muted-foreground text-xs capitalize">{event.type}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{event.profiles?.full_name || 'Unknown'}</div>
                    <div className="text-muted-foreground text-xs">{event.profiles?.email}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div>{event.date}</div>
                    <div className="text-xs">{event.time}</div>
                  </td>
                  <td className="px-4 py-3">
                    {event.status === 'published' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Link 
                      href={`/e/${event.slug}`} 
                      target="_blank"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View
                    </Link>
                    <ConfirmAction
                      destructive
                      description="Are you sure you want to delete this event? This action cannot be undone and will delete all associated tickets, waitlists, and records."
                      onConfirm={() => handleDelete(event.id)}
                    >
                      <button
                        disabled={loadingId === event.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </ConfirmAction>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Page {page + 1} of {Math.ceil(count / PAGE_SIZE) || 1}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-2 rounded-md border border-border bg-background hover:bg-muted disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={(page + 1) * PAGE_SIZE >= count}
            className="p-2 rounded-md border border-border bg-background hover:bg-muted disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

