"use client";

import { useEffect, useState, use } from "react";
import { Users, Eye, CreditCard, Calendar, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function EventOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;
  const [event, setEvent] = useState<any>(null);
  const [metrics, setMetrics] = useState({ rsvps: 0, sales: 0, views: 0 });
  const [guestLimit, setGuestLimit] = useState<number | null>(null);
  const [recentAttendees, setRecentAttendees] = useState<any[]>([]);
  const [chartData, setChartData] = useState<{ day: string; count: number }[]>([]);
  const [ticketData, setTicketData] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      
      // Fetch Event
      const { data: eventData } = await supabase
        .from('events')
        .select('*, profiles(plan)')
        .eq('id', eventId)
        .single();
      
      if (eventData) {
        setEvent(eventData);

        // Fetch Attendees count
        const { count: rsvpCount } = await supabase
          .from('attendees')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', eventId);

        // Fetch Ticket Sales sum
        const { data: orders } = await supabase
          .from('orders')
          .select('amount')
          .eq('event_id', eventId)
          .eq('status', 'paid');
        
        const totalSales = orders?.reduce((acc, order) => acc + Number(order.amount), 0) || 0;

        // Fetch Recent Attendees
        const { data: attendees } = await supabase
          .from('attendees')
          .select('*, ticket_types(name)')
          .eq('event_id', eventId)
          .order('created_at', { ascending: false });

        const profiles = eventData.profiles as any;
        const organizerPlan = Array.isArray(profiles) ? profiles[0]?.plan : profiles?.plan;
        
        if (organizerPlan) {
          const { data: planData } = await supabase
            .from('plans')
            .select('max_guests_per_event')
            .eq('id', organizerPlan)
            .single();
          if (planData?.max_guests_per_event) {
            setGuestLimit(planData.max_guests_per_event);
          }
        }

        setMetrics({
          rsvps: rsvpCount || 0,
          sales: totalSales,
          views: 0, // Views tracking not implemented yet
        });
        setRecentAttendees((attendees || []).slice(0, 5));

        if (attendees) {
          // Group for line/bar chart by day
          const countsByDay: Record<string, number> = {};
          const countsByTicket: Record<string, number> = {};

          attendees.forEach(a => {
            const day = new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            countsByDay[day] = (countsByDay[day] || 0) + 1;
            
            const ticketName = (a.ticket_types as any)?.name || 'General';
            countsByTicket[ticketName] = (countsByTicket[ticketName] || 0) + 1;
          });

          setChartData(Object.entries(countsByDay).map(([day, count]) => ({ day, count })));
          setTicketData(Object.entries(countsByTicket).map(([name, value]) => ({ name, value })));
        }
      }
      
      setLoading(false);
    }
    fetchData();
  }, [eventId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-4 gap-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!event) {
    return <div>Event not found.</div>;
  }

  return (
    <div className="space-y-8">
      {/* Event Meta Snapshot */}
      <div className="bg-muted/30 border border-border rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display">{event.title}</h2>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-2">
            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {event.date} at {event.time}</span>
            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {event.venue_name}</span>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${event.status === 'published' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
          {event.status}
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="p-6 rounded-xl border border-border bg-card shadow-sm opacity-50">
          <div className="flex items-center gap-3 text-muted-foreground mb-2">
            <Eye className="w-4 h-4" /> <span className="text-sm font-medium">Page Views</span>
          </div>
          <h3 className="text-3xl font-bold">{metrics.views}</h3>
          <p className="text-xs text-muted-foreground mt-2">Tracking coming soon</p>
        </div>
        
        <div className="p-6 rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-3 text-muted-foreground mb-2">
            <Users className="w-4 h-4" /> <span className="text-sm font-medium">Total RSVPs</span>
          </div>
          <h3 className="text-3xl font-bold">{metrics.rsvps} {guestLimit ? `/ ${guestLimit}` : ''}</h3>
          <p className="text-xs text-muted-foreground mt-2">Capacity: {guestLimit ? 'Limited' : 'Unlimited'}</p>
        </div>
        
        <div className="p-6 rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-3 text-muted-foreground mb-2">
            <CreditCard className="w-4 h-4" /> <span className="text-sm font-medium">Ticket Sales</span>
          </div>
          <h3 className="text-3xl font-bold">Rs. {metrics.sales.toLocaleString()}</h3>
          <p className="text-xs text-muted-foreground mt-2">Paid via Safepay</p>
        </div>

        <div className="p-6 rounded-xl border border-border bg-card shadow-sm flex flex-col justify-center items-center text-center opacity-50">
          <p className="text-sm font-medium text-muted-foreground mb-2">Conversion Rate</p>
          <div className="relative w-16 h-16 rounded-full border-4 border-primary flex items-center justify-center">
            <span className="font-bold">0%</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card shadow-sm p-6">
          <h3 className="font-semibold text-lg font-display mb-6">Registrations Over Time</h3>
          <div className="h-64">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="day" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => String(value)} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="count" fill="#0f172a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data to display</div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm p-6">
          <h3 className="font-semibold text-lg font-display mb-6">Ticket Types Breakdown</h3>
          <div className="h-64">
            {ticketData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={ticketData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                    {ticketData.map((entry, index) => (
                      <Cell key={'cell-' + index} fill={['#0f172a', '#334155', '#64748b', '#94a3b8'][index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data to display</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="font-semibold text-lg font-display">Recent Registrations</h3>
        </div>
        
        {recentAttendees.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
            <Users className="w-12 h-12 mb-3 opacity-20" />
            <p>No registrations yet.</p>
            <p className="text-sm">Share your public link to start getting RSVPs!</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentAttendees.map((attendee) => (
              <div key={attendee.id} className="p-4 px-6 flex items-center justify-between">
                <div>
                  <p className="font-medium">{attendee.guest_name}</p>
                  <p className="text-sm text-muted-foreground">{attendee.guest_email}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(attendee.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
