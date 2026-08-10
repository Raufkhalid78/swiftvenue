"use client";

import { Button } from "@/components/ui/button";
import { CalendarPlus } from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const startDateTime = new Date(`${event.date}T${event.time}`);
  const endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000); // assume 2 hours duration

  const formatDateIcs = (date: Date) => format(date, "yyyyMMdd'T'HHmmss");
  
  // Google calendar expects UTC time if Z is appended, so we'll just format as local without Z, 
  // or use UTC ISO strings without hyphens
  const getGoogleCalendarUrl = () => {
    const start = startDateTime.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const end = endDateTime.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const url = new URL('https://calendar.google.com/calendar/render');
    url.searchParams.append('action', 'TEMPLATE');
    url.searchParams.append('text', event.title);
    url.searchParams.append('dates', `${start}/${end}`);
    url.searchParams.append('details', event.description || '');
    url.searchParams.append('location', event.venue_name);
    return url.toString();
  };

  const getOutlookCalendarUrl = () => {
    const url = new URL('https://outlook.live.com/calendar/0/deeplink/compose');
    url.searchParams.append('path', '/calendar/action/compose');
    url.searchParams.append('rru', 'addevent');
    url.searchParams.append('subject', event.title);
    url.searchParams.append('startdt', startDateTime.toISOString());
    url.searchParams.append('enddt', endDateTime.toISOString());
    url.searchParams.append('body', event.description || '');
    url.searchParams.append('location', event.venue_name);
    return url.toString();
  };

  const getYahooCalendarUrl = () => {
    const url = new URL('https://calendar.yahoo.com/');
    url.searchParams.append('v', '60');
    url.searchParams.append('title', event.title);
    url.searchParams.append('st', formatDateIcs(startDateTime));
    url.searchParams.append('et', formatDateIcs(endDateTime));
    url.searchParams.append('desc', event.description || '');
    url.searchParams.append('in_loc', event.venue_name);
    return url.toString();
  };

  const handleDownloadIcs = () => {
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <CalendarPlus className="w-4 h-4" /> Add to Calendar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <a href={getGoogleCalendarUrl()} target="_blank" rel="noopener noreferrer" className="cursor-pointer w-full">
            Google Calendar
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={getOutlookCalendarUrl()} target="_blank" rel="noopener noreferrer" className="cursor-pointer w-full">
            Outlook Calendar
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={getYahooCalendarUrl()} target="_blank" rel="noopener noreferrer" className="cursor-pointer w-full">
            Yahoo Calendar
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownloadIcs} className="cursor-pointer w-full">
          Apple Calendar (.ics)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
