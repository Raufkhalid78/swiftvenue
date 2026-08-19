"use client";

import { useEffect, useState, use, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, UserPlus, MoreHorizontal, CheckCircle2, XCircle, Upload, Printer, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { generateBadgePDF } from "@/lib/export-badges";
import { toast } from "sonner";

export default function GuestsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [guests, setGuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGuest, setSelectedGuest] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const loadGuests = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('attendees')
      .select('*, orders(refund_status), ticket_types(name)')
      .eq('event_id', resolvedParams.id)
      .order('created_at', { ascending: false });
    
    if (data) setGuests(data);
    setLoading(false);
  }, [resolvedParams.id]);

  useEffect(() => {
    loadGuests();
  }, [loadGuests]);

  const handleExportCSV = () => {
    if (guests.length === 0) return;

    // Collect all unique custom question keys across attendees
    const customKeys = new Set<string>();
    guests.forEach(g => {
      if (g.custom_responses && typeof g.custom_responses === 'object') {
        Object.keys(g.custom_responses).forEach(k => customKeys.add(k));
      }
    });

    const headers = ['Name', 'Email', 'Phone', 'Ticket Tier', 'Status', 'Registered At', ...Array.from(customKeys)];
    const rows = guests.map(g => {
      const customVals = Array.from(customKeys).map(k => {
        const val = g.custom_responses?.[k];
        return typeof val === 'boolean' ? (val ? 'Yes' : 'No') : (val || '');
      });

      return [
        `"${g.guest_name?.replace(/"/g, '""') || ''}"`,
        `"${g.guest_email || ''}"`,
        `"${g.guest_phone || ''}"`,
        `"${g.ticket_types?.name || g.ticket_type || 'General'}"`,
        `"${g.status}"`,
        `"${new Date(g.created_at).toLocaleString()}"`,
        ...customVals.map(v => `"${String(v).replace(/"/g, '""')}"`)
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `attendees-export-${resolvedParams.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredGuests = guests.filter(g => 
    g.guest_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.guest_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleApproveRefund = async (orderId: string) => {
    try {
      const res = await fetch('/api/payment/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action: 'approve' })
      });
      if (res.ok) {
        setGuests(guests.map(g => g.order_id === orderId ? { ...g, status: 'cancelled', orders: { ...g.orders, refund_status: 'refunded' } } : g));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrintBadges = async () => {
    if (guests.length === 0) {
      toast.error('No guests to print badges for.');
      return;
    }

    setIsPrinting(true);
    try {
      await generateBadgePDF({
        eventTitle: 'Event Badges',
        attendees: guests.map(g => ({
          id: g.id,
          guest_name: g.guest_name,
          guest_email: g.guest_email,
          ticket_tier: g.ticket_types?.name || g.ticket_type,
          custom_responses: g.custom_responses,
        })),
        format: 'grid_6',
      });
      toast.success('Generated printable badge sheet!');
    } catch (err: any) {
      toast.error('Failed to generate badges');
    } finally {
      setIsPrinting(false);
    }
  };

  const stats = {
    total: guests.length,
    registered: guests.filter(g => g.status === 'registered').length,
    attended: guests.filter(g => g.status === 'attended').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold font-display">Guest List</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage RSVPs, check-ins, and attendee questionnaire responses.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href={`/dashboard/events/${resolvedParams.id}/guests/import`}>
            <Button variant="outline" className="gap-2">
              <Upload className="w-4 h-4" /> Import CSV
            </Button>
          </Link>
          <Button variant="outline" className="gap-2" onClick={handleExportCSV}>
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Button variant="outline" className="gap-2" onClick={handlePrintBadges} disabled={isPrinting || guests.length === 0}>
            {isPrinting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
            Print Badges
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border p-4 rounded-xl shadow-sm text-center">
          <p className="text-sm text-muted-foreground mb-1">Total RSVPs</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl shadow-sm text-center">
          <p className="text-sm text-emerald-600 mb-1">Checked In</p>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{stats.attended}</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl shadow-sm text-center">
          <p className="text-sm text-amber-600 mb-1">Pending Check-in</p>
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{stats.registered}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between gap-4 bg-muted/20">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search guests by name or email..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 bg-background" 
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Showing {filteredGuests.length} of {guests.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Guest Name</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Ticket Type</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="px-6 py-4"><Skeleton className="h-5 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-48" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-8 ml-auto rounded-full" /></td>
                  </tr>
                ))
              ) : filteredGuests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    {searchQuery ? 'No matching guests found.' : 'No guests have registered yet.'}
                  </td>
                </tr>
              ) : (
                filteredGuests.map((guest) => (
                  <tr key={guest.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">
                      <div>{guest.guest_name}</div>
                      {guest.guest_phone && <div className="text-xs text-muted-foreground">{guest.guest_phone}</div>}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{guest.guest_email || '—'}</td>
                    <td className="px-6 py-4 capitalize">{guest.ticket_types?.name || guest.ticket_type || 'General'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        guest.status === 'registered' ? 'bg-amber-500/10 text-amber-600' :
                        guest.status === 'attended' ? 'bg-emerald-500/10 text-emerald-600' :
                        'bg-destructive/10 text-destructive'
                      }`}>
                        {guest.status === 'registered' && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                        {guest.status === 'attended' && <CheckCircle2 className="w-3 h-3" />}
                        {guest.status === 'cancelled' && <XCircle className="w-3 h-3" />}
                        {guest.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedGuest(guest)}>View Details & Answers</DropdownMenuItem>
                          {guest.orders?.refund_status === 'requested' && (
                            <DropdownMenuItem className="text-amber-600 focus:text-amber-700" onClick={() => handleApproveRefund(guest.order_id)}>
                              Approve Refund
                            </DropdownMenuItem>
                          )}
                          {guest.orders?.refund_status === 'refunded' && (
                            <DropdownMenuItem disabled>Refunded</DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Guest Details & Questionnaire Dialog */}
      {selectedGuest && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-semibold text-lg">Attendee Details</h3>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setSelectedGuest(null)}>✕</Button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2 p-3 bg-muted/30 rounded-xl">
                <div>
                  <div className="text-xs text-muted-foreground">Guest Name</div>
                  <div className="font-medium">{selectedGuest.guest_name}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Ticket Tier</div>
                  <div className="font-medium">{selectedGuest.ticket_types?.name || selectedGuest.ticket_type}</div>
                </div>
                <div className="col-span-2 pt-1">
                  <div className="text-xs text-muted-foreground">Email</div>
                  <div className="font-mono text-xs">{selectedGuest.guest_email || '—'}</div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Custom Questionnaire Responses</h4>
                {selectedGuest.custom_responses && Object.keys(selectedGuest.custom_responses).length > 0 ? (
                  <div className="space-y-2 p-3 bg-muted/20 border border-border rounded-xl">
                    {Object.entries(selectedGuest.custom_responses).map(([k, v]) => (
                      <div key={k} className="flex justify-between items-start text-xs border-b border-border/40 pb-1.5 last:border-0 last:pb-0">
                        <span className="text-muted-foreground font-medium">{k}:</span>
                        <span className="font-semibold text-foreground text-right">{typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic p-3 bg-muted/10 rounded-xl">No custom answers submitted.</p>
                )}
              </div>
            </div>

            <Button className="w-full" variant="outline" onClick={() => setSelectedGuest(null)}>
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
