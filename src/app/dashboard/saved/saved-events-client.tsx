'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, MapPin, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SaveButton } from '@/components/save-button';

interface SavedEventItem {
  id: string;
  event_id: string;
  events: {
    id: string;
    title: string;
    slug: string;
    date: string;
    time?: string | null;
    venue_name?: string | null;
    hero_image_url?: string | null;
  } | {
    id: string;
    title: string;
    slug: string;
    date: string;
    time?: string | null;
    venue_name?: string | null;
    hero_image_url?: string | null;
  }[];
}

export function SavedEventsClient({ initialEvents }: { initialEvents: SavedEventItem[] }) {
  const [savedList, setSavedList] = useState(initialEvents);

  const handleUnsave = (eventId: string) => {
    setSavedList(prev => prev.filter(item => {
      const ev = Array.isArray(item.events) ? item.events[0] : item.events;
      return ev?.id !== eventId;
    }));
  };

  if (!savedList || savedList.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-12 text-center shadow-sm animate-in fade-in duration-300">
        <Heart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="text-xl font-bold font-display mb-2">No saved events</h3>
        <p className="text-muted-foreground mb-6 max-w-sm mx-auto text-sm">
          You haven't saved any events yet. Browse our events and click the heart icon to save them here.
        </p>
        <Button asChild>
          <Link href="/">Explore Events</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {savedList.map((saved) => {
        const event = Array.isArray(saved.events) ? saved.events[0] : saved.events;
        if (!event) return null;

        return (
          <div key={saved.id} className="relative group bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300">
            <Link href={`/e/${event.slug}`} className="block">
              <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                {event.hero_image_url ? (
                  <Image 
                    src={event.hero_image_url} 
                    alt={event.title} 
                    width={800} 
                    height={400} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Calendar className="w-8 h-8 opacity-20" />
                  </div>
                )}
              </div>
            </Link>

            {/* Interactive Unsave Heart Button */}
            <div className="absolute top-3 right-3 z-10">
              <SaveButton 
                eventId={event.id} 
                iconOnly={true} 
                onToggle={(isSaved) => {
                  if (!isSaved) handleUnsave(event.id);
                }} 
              />
            </div>

            <div className="p-4">
              <Link href={`/e/${event.slug}`}>
                <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-1">{event.title}</h3>
              </Link>
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary shrink-0" /> {event.date} {event.time && `at ${event.time}`}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary shrink-0" /> <span className="line-clamp-1">{event.venue_name || 'TBA'}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
