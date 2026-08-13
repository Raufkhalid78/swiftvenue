import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Calendar, MapPin, Ticket } from "lucide-react";
import { AttendeeList } from "@/components/attendee-list";
import { DownloadTicketButton } from "@/components/download-ticket-button";
import Image from "next/image";

export const metadata = {
  title: 'My Tickets | SwiftVenue',
};

export default async function MyTicketsPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth/signin");
  }

  // Fetch orders where guest_email is the user's email
  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      id,
      created_at,
      events (
        title,
        slug,
        date,
        venue_name,
        hero_image_url,
        user_id
      ),
      attendees (
        id,
        guest_name,
        guest_email,
        ticket_type,
        status
      )
    `)
    .eq("guest_email", session.user.email)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching tickets:", error);
  }

  // Fetch plans for all unique event owners to determine remove_branding
  const ownerIds = [...new Set((orders || []).map(o => {
    const event = Array.isArray(o.events) ? o.events[0] : o.events;
    return event?.user_id;
  }).filter(Boolean))];

  let brandingMap: Record<string, boolean> = {};

  if (ownerIds.length > 0) {
    const { data: profiles } = await supabase.from('profiles').select('id, plan').in('id', ownerIds);
    if (profiles) {
      const planIds = [...new Set(profiles.map(p => p.plan || 'free'))];
      const { data: plans } = await supabase.from('plans').select('id, remove_branding').in('id', planIds);
      
      const planMap = Object.fromEntries((plans || []).map(p => [p.id, p.remove_branding]));
      
      profiles.forEach(profile => {
        brandingMap[profile.id] = planMap[profile.plan || 'free'] || false;
      });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">My Tickets</h1>
        <p className="text-muted-foreground mt-1">View your purchased tickets and manage your guests.</p>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-xl">
          <Ticket className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No tickets found</h3>
          <p className="text-muted-foreground mb-6">You haven't purchased any tickets using this email address.</p>
          <Link href="/" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
            Browse Events
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {orders.map((order) => {
            const event = Array.isArray(order.events) ? order.events[0] : order.events;
            if (!event) return null;
            
            return (
              <div key={order.id} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="flex flex-col md:flex-row border-b border-border">
                  {/* Event Thumbnail */}
                  <div className="w-full md:w-48 h-32 md:h-auto bg-muted shrink-0 relative">
                    {event.hero_image_url ? (
                      <Image src={event.hero_image_url} alt={event.title} width={800} height={400} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-muted to-muted-foreground/20" />
                    )}
                  </div>
                  
                  {/* Event Details */}
                  <div className="p-4 md:p-6 flex-1 flex flex-col justify-center">
                    <Link href={`/e/${event.slug}`} className="hover:underline">
                      <h2 className="text-xl font-bold font-display line-clamp-1">{event.title}</h2>
                    </Link>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 shrink-0" />
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span className="line-clamp-1">{event.venue_name}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Download Button */}
                  <div className="p-4 md:p-6 flex items-center justify-center md:justify-end border-t md:border-t-0 md:border-l border-border md:w-56 shrink-0 bg-muted/5">
                    <DownloadTicketButton orderId={order.id} removeBranding={brandingMap[event.user_id] || false} />
                  </div>
                </div>
                
                {/* Tickets List */}
                <div className="p-4 md:p-6 bg-muted/5">
                  <AttendeeList initialAttendees={order.attendees || []} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
