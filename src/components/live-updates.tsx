"use client";

import { useEffect, useState } from "react";
import { Megaphone, X, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function LiveUpdatesWidget({ updates, eventId }: { updates: any[], eventId: string }) {
  const [isOpen, setIsOpen] = useState(true);
  const [localUpdates, setLocalUpdates] = useState(updates);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`public:event_updates:${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'event_updates',
          filter: `event_id=eq.${eventId}`
        },
        (payload) => {
          setLocalUpdates((prev) => {
            const newArray = [payload.new, ...prev];
            return newArray.sort((a, b) => {
              if (a.is_pinned && !b.is_pinned) return -1;
              if (!a.is_pinned && b.is_pinned) return 1;
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });
          });
          setIsOpen(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  if (!localUpdates || localUpdates.length === 0) return null;

  if (!isOpen) {
    return (
      <Button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-50 rounded-full shadow-lg h-12 w-12 p-0 bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        <Megaphone className="w-5 h-5 animate-pulse" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 w-80 max-w-[calc(100vw-2rem)] bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-5">
      <div className="bg-primary/5 px-4 py-3 border-b border-border flex justify-between items-center">
        <h3 className="font-semibold flex items-center gap-2 text-sm">
          <Megaphone className="w-4 h-4 text-primary" /> Live Updates
        </h3>
        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => setIsOpen(false)}>
          <X className="w-3 h-3" />
        </Button>
      </div>
      <div className="max-h-64 overflow-y-auto p-4 space-y-4">
        {localUpdates.map(u => (
          <div key={u.id} className="text-sm">
            {u.is_pinned && <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded mb-1"><Pin className="w-3 h-3" /> Pinned</span>}
            <p className="text-foreground">{u.message}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{new Date(u.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
