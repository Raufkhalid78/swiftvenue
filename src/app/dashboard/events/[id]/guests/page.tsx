"use client";

import { useEffect, useState, use } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, UserPlus, MoreHorizontal, CheckCircle2, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export default function GuestsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [guests, setGuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGuests() {
      const supabase = createClient();
      const { data } = await supabase
        .from('attendees')
        .select('*')
        .eq('event_id', resolvedParams.id)
        .order('created_at', { ascending: false });
      
      if (data) setGuests(data);
      setLoading(false);
    }
    loadGuests();
  }, [resolvedParams.id]);

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
          <p className="text-sm text-muted-foreground mt-1">Manage RSVPs, check-ins, and attendee data.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Button className="gap-2">
            <UserPlus className="w-4 h-4" /> Add Guest
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
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
            <Input placeholder="Search guests by name or email..." className="pl-9 bg-background" />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Filter: All</span>
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
              ) : guests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No guests have registered yet.
                  </td>
                </tr>
              ) : (
                guests.map((guest) => (
                  <tr key={guest.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{guest.guest_name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{guest.guest_email || '—'}</td>
                    <td className="px-6 py-4 capitalize">{guest.ticket_type}</td>
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
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
