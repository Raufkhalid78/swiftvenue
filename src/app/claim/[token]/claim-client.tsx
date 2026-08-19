'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Ticket, Calendar, MapPin, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { claimTransferredTicket } from './actions';
import Image from 'next/image';
import Link from 'next/link';

interface ClaimClientProps {
  attendee: any;
  token: string;
}

export function ClaimClient({ attendee, token }: ClaimClientProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [claimed, setClaimed] = useState(false);

  const event = Array.isArray(attendee.events) ? attendee.events[0] : attendee.events;
  const ticketTier = Array.isArray(attendee.ticket_types) ? attendee.ticket_types[0] : attendee.ticket_types;

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error('Please enter your full name and email address.');
      return;
    }

    setLoading(true);
    try {
      const result = await claimTransferredTicket(token, { name, email, phone });
      if (result.success) {
        setClaimed(true);
        toast.success('Ticket claimed successfully!');
      } else {
        toast.error(result.error || 'Failed to claim ticket.');
      }
    } catch (err: any) {
      toast.error(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (claimed) {
    return (
      <div className="p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-display">Ticket Claimed!</h2>
          <p className="text-muted-foreground text-sm">
            We have sent your ticket confirmation and digital QR pass to <strong>{email}</strong>.
          </p>
        </div>

        <div className="p-4 bg-muted/40 border border-border rounded-xl text-left space-y-1 text-sm">
          <div className="font-semibold text-foreground">{event?.title}</div>
          <div className="text-muted-foreground text-xs">{event?.date} • {event?.venue_name}</div>
          <div className="text-xs font-medium text-primary mt-2">Holder: {name}</div>
        </div>

        <Button asChild className="w-full">
          <Link href={`/e/${event?.slug}`}>
            View Event Page <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Event Header Banner */}
      {event?.hero_image_url ? (
        <div className="relative h-44 w-full bg-slate-900">
          <Image 
            src={event.hero_image_url} 
            alt={event.title} 
            fill 
            className="object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
        </div>
      ) : (
        <div className="h-24 bg-gradient-to-r from-primary/20 via-indigo-500/20 to-purple-500/20" />
      )}

      <div className="p-6 sm:p-8 space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
            <Ticket className="w-3.5 h-3.5" /> Transferred Ticket
          </div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">{event?.title}</h1>
          
          <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{event?.date} {event?.time ? `at ${event?.time}` : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-500" />
              <span>{event?.venue_name || 'Venue TBA'}</span>
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-muted/40 border border-border rounded-xl flex items-center justify-between text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Ticket Tier</div>
            <div className="font-semibold">{ticketTier?.name || 'General Admission'}</div>
          </div>
          {attendee.original_purchaser_email && (
            <div className="text-right">
              <div className="text-[10px] text-muted-foreground">From</div>
              <div className="text-xs font-mono">{attendee.original_purchaser_email.split('@')[0]}...</div>
            </div>
          )}
        </div>

        <form onSubmit={handleClaim} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Your Full Name</Label>
            <Input 
              id="name" 
              placeholder="e.g. Sarah Jenkins" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required 
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Your Email Address</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="sarah@example.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
            <p className="text-[11px] text-muted-foreground">Your check-in QR code will be delivered here.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone Number (Optional)</Label>
            <Input 
              id="phone" 
              placeholder="+92 300 1234567" 
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
            />
          </div>

          <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Confirm & Claim Ticket"}
          </Button>
        </form>
      </div>
    </div>
  );
}
