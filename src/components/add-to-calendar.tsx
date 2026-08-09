"use client";

import { Button } from "@/components/ui/button";
import { CalendarPlus } from "lucide-react";
import { format } from "date-fns";

interface AddToCalendarProps {
  event: {
    title: string;
    description?: string;
    venue_name: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:mm
  };
}

export function AddToCalendar({ event }: AddToCalendarProps) {
  const handleDownloadIcs = () => {
    // Construct event date
    const startDateTime = new Date(`${event.date}T${event.time}`);
    const endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000); // assume 2 hours duration

    const formatDateIcs = (date: Date) => {
      return format(date, "yyyyMMdd'T'HHmmss");
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `SUMMARY:${event.title}`,
      `DTSTART:${formatDateIcs(startDateTime)}`,
      `DTEND:${formatDateIcs(endDateTime)}`,
      `LOCATION:${event.venue_name}`,
      `DESCRIPTION:${event.description?.replace(/\n/g, '\\n') || ''}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button variant="outline" onClick={handleDownloadIcs} className="gap-2">
      <CalendarPlus className="w-4 h-4" /> Add to Calendar
    </Button>
  );
}
