import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Calendar, MapPin, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function SavedEventsPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth/signin");
  }

  const { data: savedEvents, error } = await supabase
    .from('saved_events')
    .select(`
      id,
      event_id,
      events (
        id,
        title,
        slug,
        date,
        time,
        venue_name,
        hero_image_url
      )
    `)
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching saved events:", error);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-display tracking-tight">Saved Events</h1>
        <p className="text-muted-foreground mt-2">Events you have bookmarked for later.</p>
      </div>

      {!savedEvents || savedEvents.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center shadow-sm">
          <Heart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-xl font-bold font-display mb-2">No saved events</h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            You haven't saved any events yet. Browse our events and click the heart icon to save them here.
          </p>
          <Button asChild>
            <Link href="/">Explore Events</Link>
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedEvents.map((saved) => {
            const event = Array.isArray(saved.events) ? saved.events[0] : saved.events;
            if (!event) return null;
            
            return (
              <Link key={saved.id} href={`/e/${event.slug}`} className="group block">
                <div className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-all duration-300">
                  <div className="aspect-[4/3] bg-muted relative">
                    {event.hero_image_url ? (
                      <img src={event.hero_image_url} alt={event.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Calendar className="w-8 h-8 opacity-20" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur text-red-500 p-2 rounded-full shadow-sm">
                      <Heart className="w-4 h-4 fill-current" />
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-1">{event.title}</h3>
                    <div className="space-y-1.5 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> {event.date} {event.time && `at ${event.time}`}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> <span className="line-clamp-1">{event.venue_name || 'TBA'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
