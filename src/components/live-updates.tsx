"use client";

import { useState } from "react";
import { Megaphone, X, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LiveUpdatesWidget({ updates }: { updates: any[] }) {
  const [isOpen, setIsOpen] = useState(true);

  if (!updates || updates.length === 0) return null;

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
        {updates.map(u => (
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
