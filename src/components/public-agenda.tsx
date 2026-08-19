"use client";

import { useState, useMemo } from "react";
import { Clock, MapPin, User, CalendarDays } from "lucide-react";

interface AgendaSession {
  id: string;
  title: string;
  speaker_name?: string | null;
  start_time: string;
  end_time?: string | null;
  description?: string | null;
  day_number?: number | null;
  location_room?: string | null;
  capacity?: number | null;
}

export function PublicAgenda({ items = [] }: { items: AgendaSession[] }) {
  const daysList = useMemo(() => {
    const set = new Set<number>([1]);
    items.forEach(it => set.add(it.day_number || 1));
    return Array.from(set).sort((a, b) => a - b);
  }, [items]);

  const [activeDay, setActiveDay] = useState<number>(daysList[0] || 1);

  const currentItems = useMemo(() => {
    return items.filter(it => (it.day_number || 1) === activeDay);
  }, [items, activeDay]);

  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-6">
      {/* Day Switcher */}
      {daysList.length > 1 && (
        <div className="flex items-center gap-2 border-b border-border/80 pb-2 overflow-x-auto">
          {daysList.map(d => (
            <button
              key={d}
              onClick={() => setActiveDay(d)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeDay === d
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              Day {d}
            </button>
          ))}
        </div>
      )}

      {/* Session Timeline Cards */}
      <div className="space-y-3.5">
        {currentItems.map((item) => (
          <div 
            key={item.id}
            className="p-5 bg-card/60 backdrop-blur-sm border border-border rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-start gap-4 hover:border-primary/30 transition-all"
          >
            <div className="flex sm:flex-col items-center justify-center min-w-[85px] p-2.5 bg-primary/10 text-primary rounded-xl text-center">
              <Clock className="w-4 h-4 mb-0.5 sm:mb-1 mr-1.5 sm:mr-0" />
              <span className="text-xs font-bold font-mono">{item.start_time}</span>
              {item.end_time && (
                <span className="text-[10px] text-muted-foreground font-mono ml-1 sm:ml-0">
                  {item.end_time}
                </span>
              )}
            </div>

            <div className="space-y-1.5 flex-1">
              <h4 className="text-base font-bold text-foreground">{item.title}</h4>
              
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {item.speaker_name && (
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <User className="w-3.5 h-3.5 text-primary" /> {item.speaker_name}
                  </span>
                )}
                {item.location_room && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-indigo-500" /> {item.location_room}
                  </span>
                )}
              </div>

              {item.description && (
                <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                  {item.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
