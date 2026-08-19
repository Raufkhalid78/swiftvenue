"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Ticket } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function WalkInModal({ eventId }: { eventId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [ticketTypes, setTicketTypes] = useState<any[]>([]);
  
  useEffect(() => {
    if (open && ticketTypes.length === 0) {
      supabase.from('ticket_types')
        .select('*')
        .eq('event_id', eventId)
        .order('order_index')
        .then(({ data }) => {
          if (data) setTicketTypes(data);
        });
    }
  }, [open, eventId, ticketTypes.length, supabase]);

  const [ticketTypeId, setTicketTypeId] = useState<string>('');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [isComplimentary, setIsComplimentary] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketTypeId || !guestName) {
      toast.error('Name and Ticket Tier are required');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/walk-in-sale`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketTypeId,
          guestName,
          guestPhone,
          guestEmail,
          isComplimentary
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record sale');

      toast.success('Walk-in sale recorded successfully!');
      
      // Reset form
      setGuestName('');
      setGuestPhone('');
      setGuestEmail('');
      setIsComplimentary(false);
      setOpen(false);
      
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Only show active ticket types that have remaining capacity
  const availableTiers = ticketTypes.filter(t => t.is_active && (t.quantity_total - t.quantity_sold > 0));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="gap-2">
          <Ticket className="w-4 h-4" />
          Sell at Door
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Walk-In Sale</DialogTitle>
          <DialogDescription>
            Record a cash sale or complimentary entry at the door. Guests are checked in automatically.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Ticket Tier *</Label>
            <Select value={ticketTypeId} onValueChange={setTicketTypeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a ticket tier" />
              </SelectTrigger>
              <SelectContent>
                {availableTiers.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} (PKR {t.price}) - {t.quantity_total - t.quantity_sold} left
                  </SelectItem>
                ))}
                {availableTiers.length === 0 && (
                  <SelectItem value="none" disabled>No tickets available</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Guest Name *</Label>
            <Input 
              placeholder="e.g. Ali Khan" 
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Phone Number (Recommended)</Label>
            <Input 
              type="tel"
              placeholder="e.g. +923001234567" 
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Email Address (Optional)</Label>
            <Input 
              type="email"
              placeholder="For email confirmation" 
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30 mt-4">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Complimentary Entry</Label>
              <p className="text-xs text-muted-foreground">Record this as a free ticket (no cash collected)</p>
            </div>
            <Switch checked={isComplimentary} onCheckedChange={setIsComplimentary} />
          </div>

          <div className="pt-4 flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading || !ticketTypeId || !guestName}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {isComplimentary ? 'Issue Free Entry' : 'Record Cash Sale'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
