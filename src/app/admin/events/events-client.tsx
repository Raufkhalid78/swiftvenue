'use client';

import { useState } from 'react';
import { Search, Trash2, ExternalLink } from 'lucide-react';
import { deleteEvent } from './actions';
import Link from 'next/link';

export function EventsClient({ initialEvents }: { initialEvents: any[] }) {
  const [events, setEvents] = useState(initialEvents);
  const [search, setSearch] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filteredEvents = events.filter(e => 
    e.title?.toLowerCase().includes(search.toLowerCase()) || 
    e.profiles?.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone and will delete all associated tickets, waitlists, and records.')) return;
    
    setLoadingId(eventId);
    const result = await deleteEvent(eventId);
    if (result.success) {
      setEvents(events.filter(e => e.id !== eventId));
    } else {
      alert(result.error);
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
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No events found</td>
                </tr>
              ) : filteredEvents.map((event) => (
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
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
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
                    <button
                      disabled={loadingId === event.id}
                      onClick={() => handleDelete(event.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
