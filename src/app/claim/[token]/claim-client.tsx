'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Ticket, 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  ArrowRight, 
  Loader2, 
  Download, 
  Copy, 
  Check, 
  ShieldCheck,
  Clock
} from 'lucide-react';
import { claimTransferredTicket } from './actions';
import { WalletButtons } from '@/components/wallet-buttons';
import Image from 'next/image';
import Link from 'next/link';

interface ClaimClientProps {
  attendee: any;
  token: string;
}

export function ClaimClient({ attendee: initialAttendee, token }: ClaimClientProps) {
  const [attendee, setAttendee] = useState(initialAttendee);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [hasCopiedId, setHasCopiedId] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const isClaimed = Boolean(attendee.transferred_at);

  const event = Array.isArray(attendee.events) ? attendee.events[0] : attendee.events;
  const ticketTier = Array.isArray(attendee.ticket_types) ? attendee.ticket_types[0] : attendee.ticket_types;

  // Generate QR Code when claimed
  useEffect(() => {
    if (isClaimed && attendee.id) {
      import('qrcode').then(({ default: QRCode }) => {
        QRCode.toDataURL(attendee.id, {
          width: 320,
          margin: 1,
          color: { dark: '#0f172a', light: '#ffffff' },
        }).then(setQrDataUrl).catch(console.error);
      });
    }
  }, [isClaimed, attendee.id]);

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error('Please enter your full name and email address.');
      return;
    }

    setLoading(true);
    try {
      const result = await claimTransferredTicket(token, { name, email, phone });
      if (result.success && result.attendee) {
        setAttendee(result.attendee);
        toast.success('Ticket claimed successfully!');
      } else {
        toast.error(result.error || 'Failed to claim ticket.');
      }
    } catch {
      toast.error('An unexpected error occurred while claiming ticket.');
    } finally {
      setLoading(false);
    }
  };

  const copyTicketId = () => {
    navigator.clipboard.writeText(attendee.id);
    setHasCopiedId(true);
    toast.success('Ticket ID copied to clipboard');
    setTimeout(() => setHasCopiedId(false), 2000);
  };

  const handleDownloadPDF = async () => {
    setDownloadingPdf(true);
    try {
      const [{ default: jsPDF }, { default: QRCode }] = await Promise.all([
        import('jspdf'),
        import('qrcode'),
      ]);

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const qrImage = await QRCode.toDataURL(attendee.id, {
        width: 250,
        margin: 0,
      });

      // Background Header
      doc.setFillColor(15, 23, 42); // slate-900
      doc.roundedRect(15, 20, 180, 100, 4, 4, 'F');

      // Title & Tier
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text(event?.title || 'SwiftVenue Event Pass', 25, 36);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(`Tier: ${ticketTier?.name || 'General Admission'}`, 25, 46);
      doc.text(`Date: ${event?.date || 'TBD'} ${event?.time ? `at ${event.time}` : ''}`, 25, 53);
      doc.text(`Venue: ${event?.venue_name || 'TBD'}`, 25, 60);

      // Guest Details Pill
      doc.setFillColor(30, 41, 59); // slate-800
      doc.roundedRect(25, 70, 100, 36, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text(`Attendee: ${attendee.guest_name}`, 30, 80);
      doc.text(`Email: ${attendee.guest_email}`, 30, 87);
      doc.text(`Pass ID: ${attendee.id.substring(0, 18)}...`, 30, 94);

      // QR Code
      doc.addImage(qrImage, 'PNG', 135, 35, 50, 50);

      // Instructions
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Show this QR pass at the entrance for instant check-in.', 25, 114);

      doc.save(`Ticket-${event?.title?.replace(/\s+/g, '-') || 'Pass'}-${attendee.guest_name}.pdf`);
      toast.success('Ticket PDF downloaded!');
    } catch {
      toast.error('Failed to generate PDF pass');
    } finally {
      setDownloadingPdf(false);
    }
  };

  // ==========================================
  // VIEW: TICKET IS CLAIMED (DIGITAL PASS)
  // ==========================================
  if (isClaimed) {
    return (
      <div className="flex flex-col">
        {/* Header Hero */}
        {event?.hero_image_url ? (
          <div className="relative h-40 w-full bg-slate-900">
            <Image 
              src={event.hero_image_url} 
              alt={event.title || 'Event'} 
              fill 
              className="object-cover opacity-75"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
          </div>
        ) : (
          <div className="h-24 bg-gradient-to-r from-emerald-600/20 via-teal-600/20 to-indigo-600/20" />
        )}

        <div className="p-6 sm:p-8 space-y-6">
          {/* Header Status */}
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified Digital Pass
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">
              Status: Valid
            </span>
          </div>

          <div>
            <h1 className="text-2xl font-bold font-display text-foreground leading-tight">
              {event?.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-2">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-primary" /> {event?.date}
              </span>
              {event?.time && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-primary" /> {event?.time}
                </span>
              )}
              {event?.venue_name && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-primary" /> {event?.venue_name}
                </span>
              )}
            </div>
          </div>

          {/* Scannable Pass Ticket Container */}
          <div className="p-5 bg-muted/40 border border-border rounded-2xl space-y-5 text-center shadow-inner">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Attendee Pass
              </span>
              <h3 className="text-lg font-bold text-foreground">
                {attendee.guest_name}
              </h3>
              <p className="text-xs text-muted-foreground">{attendee.guest_email}</p>
            </div>

            {/* QR Code Container */}
            <div className="bg-white p-4 rounded-2xl inline-block shadow-md border border-slate-200 mx-auto">
              {qrDataUrl ? (
                <img 
                  src={qrDataUrl} 
                  alt="Ticket Check-In QR" 
                  className="w-48 h-48 aspect-square object-contain mx-auto"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-900" />
                </div>
              )}
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="inline-block px-3 py-1 bg-primary/10 text-primary font-semibold text-xs rounded-lg border border-primary/20">
                {ticketTier?.name || 'General Admission'}
              </div>
              <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground font-mono">
                <span>Pass Ref: {attendee.id.substring(0, 16)}...</span>
                <button 
                  onClick={copyTicketId}
                  className="p-1 hover:text-foreground transition-colors"
                  title="Copy Pass ID"
                >
                  {hasCopiedId ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>

          {/* Wallet and PDF Actions */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <Button 
                onClick={handleDownloadPDF} 
                disabled={downloadingPdf} 
                variant="outline" 
                className="flex-1 gap-2"
              >
                {downloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Download PDF Pass
              </Button>
              <Button asChild className="flex-1 gap-2">
                <Link href={`/e/${event?.slug || ''}`}>
                  Event Details <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>

            <div className="pt-2">
              <WalletButtons attendeeId={attendee.id} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: TICKET INTAKE CLAIM FORM
  // ==========================================
  return (
    <div>
      {/* Event Header Banner */}
      {event?.hero_image_url ? (
        <div className="relative h-44 w-full bg-slate-900">
          <Image 
            src={event.hero_image_url} 
            alt={event.title || 'Event'} 
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
            <Ticket className="w-3.5 h-3.5" /> Transferred Ticket Pass
          </div>
          <h1 className="text-2xl font-bold font-display text-foreground leading-tight">
            Claim Your Ticket
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {attendee.original_purchaser_email 
              ? <span><strong>{attendee.original_purchaser_email}</strong> has sent you a ticket.</span>
              : 'You have been invited to claim this event ticket.'}
          </p>
        </div>

        {/* Event Summary Card */}
        <div className="p-4 bg-muted/40 border border-border rounded-xl space-y-2 text-sm">
          <div className="font-semibold text-foreground">{event?.title}</div>
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary" /> {event?.date} {event?.time ? `at ${event.time}` : ''}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary" /> {event?.venue_name}
            </span>
            <span className="flex items-center gap-1.5 font-medium text-foreground mt-1">
              <Ticket className="w-3.5 h-3.5 text-primary" /> Tier: {ticketTier?.name || 'General Admission'}
            </span>
          </div>
        </div>

        {/* Intake Form */}
        <form onSubmit={handleClaim} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input 
              id="name"
              placeholder="e.g. Alex Johnson" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input 
              id="email"
              type="email" 
              placeholder="alex@example.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
            <p className="text-[11px] text-muted-foreground">
              Your digital ticket pass will be registered to this email address.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number (Optional)</Label>
            <Input 
              id="phone"
              type="tel" 
              placeholder="+92 300 1234567" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
            />
          </div>

          <Button type="submit" className="w-full gap-2 mt-4" disabled={loading}>
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            {loading ? 'Claiming Pass...' : 'Accept & View Ticket Pass'}
          </Button>
        </form>
      </div>
    </div>
  );
}
