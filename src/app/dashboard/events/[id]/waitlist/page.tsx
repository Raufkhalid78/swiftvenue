import { createServiceClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, Mail, CheckCircle2 } from "lucide-react";
import WaitlistClient from "./waitlist-client";

export default async function WaitlistPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const service = createServiceClient();
  
  const { data: waitlist } = await service
    .from('waitlists')
    .select('*, ticket_types(name)')
    .eq('event_id', resolvedParams.id)
    .order('created_at', { ascending: true });

  const stats = {
    total: waitlist?.length || 0,
    waiting: waitlist?.filter(w => w.status === 'waiting').length || 0,
    notified: waitlist?.filter(w => w.status === 'notified').length || 0,
    claimed: waitlist?.filter(w => w.status === 'claimed').length || 0,
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display">Waitlist Management</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage attendees waiting for tickets to become available.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border border-border p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-primary/10 text-primary rounded-lg"><Users className="w-5 h-5" /></div>
          <div><p className="text-sm text-muted-foreground">Total</p><p className="text-2xl font-bold font-display">{stats.total}</p></div>
        </div>
        <div className="bg-card border border-border p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-lg"><Clock className="w-5 h-5" /></div>
          <div><p className="text-sm text-muted-foreground">Waiting</p><p className="text-2xl font-bold font-display">{stats.waiting}</p></div>
        </div>
        <div className="bg-card border border-border p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg"><Mail className="w-5 h-5" /></div>
          <div><p className="text-sm text-muted-foreground">Notified</p><p className="text-2xl font-bold font-display">{stats.notified}</p></div>
        </div>
        <div className="bg-card border border-border p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg"><CheckCircle2 className="w-5 h-5" /></div>
          <div><p className="text-sm text-muted-foreground">Claimed</p><p className="text-2xl font-bold font-display">{stats.claimed}</p></div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <WaitlistClient eventId={resolvedParams.id} initialData={waitlist || []} />
      </div>
    </div>
  );
}
