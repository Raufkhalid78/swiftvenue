"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNowStrict, isPast, isToday } from "date-fns";
import { CalendarClock } from "lucide-react";

export function EventCountdown({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const date = new Date(targetDate);
      
      if (isPast(date)) {
        if (isToday(date)) {
          setIsLive(true);
          setTimeLeft("Event is happening today!");
        } else {
          setTimeLeft("Event has ended");
          setIsLive(false);
        }
      } else {
        setTimeLeft(formatDistanceToNowStrict(date) + " away");
        setIsLive(false);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground w-max shadow-sm border border-border">
      {isLive ? (
        <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse shrink-0" />
      ) : (
        <CalendarClock className="w-4 h-4 shrink-0 opacity-70" />
      )}
      {timeLeft}
    </div>
  );
}
