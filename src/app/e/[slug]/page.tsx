import { createClient } from "@supabase/supabase-js";
import { Calendar, MapPin, Clock, Banknote } from "lucide-react";
import { notFound } from "next/navigation";
import { RegistrationWidget } from "@/components/registration-widget";

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` : "15 23 42";
}

import { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/server";

// Using server component to fetch public event data
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = createServiceClient();
  const { data: event } = await service
    .from('events')
    .select('title, description, hero_image_url')
    .eq('slug', slug)
    .single();

  if (!event) return { title: 'Event Not Found — SwiftVenue' };

  return {
    title: `${event.title} — SwiftVenue`,
    description: event.description?.slice(0, 160) || `Join ${event.title} on SwiftVenue.`,
    openGraph: {
      title: event.title,
      description: event.description?.slice(0, 160),
      images: event.hero_image_url ? [event.hero_image_url] : undefined,
    },
    alternates: { canonical: `https://swiftvenuehq.com/e/${slug}` },
  };
}

export default async function PublicEventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: event, error } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !event) {
    notFound();
  }

  const { data: agendaItems } = await supabase
    .from("agenda_items")
    .select("*")
    .eq("event_id", event.id)
    .order("order_index", { ascending: true });

  const { data: ticketTypes } = await supabase
    .from("ticket_types")
    .select("*")
    .eq("event_id", event.id)
    .eq("is_active", true)
    .order("order_index", { ascending: true });

  const themeColor = event.theme_color || '#0f172a';
  const rgbTheme = hexToRgb(themeColor);
  const template = event.template_id || 'modern';
  const isFree = !event.ticket_price || event.ticket_price <= 0;

  return (
    <div 
      className="min-h-screen bg-background"
      style={{
        // @ts-ignore
        '--theme-primary': rgbTheme,
      }}
    >
      <style dangerouslySetInnerHTML={{__html: `
        .theme-accent { color: rgb(var(--theme-primary)); }
        .theme-bg { background-color: rgb(var(--theme-primary)); }
        .theme-border { border-color: rgb(var(--theme-primary)); }
        .theme-bg-soft { background-color: rgba(var(--theme-primary), 0.1); }
      `}} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Event",
            name: event.title,
            description: event.description,
            startDate: event.date,
            location: {
              "@type": "Place",
              name: event.venue_name,
              address: {
                "@type": "PostalAddress",
                streetAddress: event.venue_address
              }
            },
            image: event.hero_image_url ? [event.hero_image_url] : undefined,
            offers: {
              "@type": "Offer",
              price: event.ticket_price || 0,
              priceCurrency: "PKR",
              availability: "https://schema.org/InStock",
              url: `https://swiftvenuehq.com/e/${event.slug}`
            }
          })
        }}
      />

      {/* --- MODERN TEMPLATE --- */}
      {template === 'modern' && (
        <>
          {/* Hero */}
          <div className="h-[40vh] w-full theme-bg-soft border-b border-border flex items-center justify-center relative overflow-hidden">
            {event.hero_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={event.hero_image_url} alt={event.title} className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-overlay" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-tr from-[rgba(var(--theme-primary),0.2)] to-transparent" />
            )}
            <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
              <span className="inline-block px-3 py-1 bg-background/80 backdrop-blur-md rounded-full text-sm font-medium mb-4 uppercase tracking-widest theme-accent">
                {event.type} Event
              </span>
              <h1 className="font-display text-5xl md:text-7xl font-bold text-foreground drop-shadow-sm">
                {event.title}
              </h1>
            </div>
          </div>

          <div className="max-w-4xl mx-auto px-4 py-16">
            <div className="grid md:grid-cols-3 gap-12">
              {/* Main Content */}
              <div className="md:col-span-2 space-y-8">
                <section>
                  <h2 className="text-2xl font-display font-semibold mb-4">About this event</h2>
                  <div className="prose prose-slate dark:prose-invert">
                    {event.description?.split('\n').map((paragraph: string, i: number) => (
                      <p key={i}>{paragraph}</p>
                    )) || <p className="text-muted-foreground italic">No description provided.</p>}
                  </div>
                </section>
                
                <section className="pt-8 border-t border-border">
                  <h2 className="text-2xl font-display font-semibold mb-6">Agenda</h2>
                  {!agendaItems || agendaItems.length === 0 ? (
                    <div className="p-8 border border-dashed border-border rounded-xl text-center text-muted-foreground bg-muted/20">
                      Agenda hasn't been published yet.
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {agendaItems.map((item: any) => (
                        <div key={item.id} className="flex gap-4 md:gap-6 border-b border-border/50 pb-6 last:border-0">
                          <div className="w-24 shrink-0 text-right">
                            <div className="font-semibold text-foreground">{item.start_time || "TBD"}</div>
                            <div className="text-sm text-muted-foreground">{item.end_time}</div>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-foreground">{item.title}</h3>
                            {item.speaker_name && (
                              <div className="text-sm theme-accent font-medium mt-1">Speaker: {item.speaker_name}</div>
                            )}
                            {item.description && (
                              <p className="text-muted-foreground text-sm mt-2">{item.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-card border theme-border shadow-sm">
                  <h3 className="font-semibold text-lg mb-4">When & Where</h3>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <Calendar className="w-5 h-5 theme-accent shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">{event.date}</p>
                        <p className="text-sm text-muted-foreground">{event.time || "Time TBD"}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <MapPin className="w-5 h-5 theme-accent shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">{event.venue_name}</p>
                        <p className="text-sm text-muted-foreground">{event.venue_address}</p>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-border">
                      <Banknote className="w-5 h-5 theme-accent shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">
                          {isFree ? "Free Entry" : `Rs. ${event.ticket_price.toLocaleString()}`}
                        </p>
                        <p className="text-sm text-muted-foreground">Ticket Price</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-2xl border border-border p-1">
                  <RegistrationWidget eventId={event.id} eventTitle={event.title} ticketTypes={ticketTypes || []} />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* --- MINIMALIST TEMPLATE --- */}
      {template === 'minimalist' && (
        <div className="max-w-3xl mx-auto px-4 py-16 sm:py-24 space-y-16">
          <header className="text-center space-y-6">
            <h1 className="font-display text-5xl sm:text-6xl font-bold tracking-tight text-foreground">
              {event.title}
            </h1>
            <p className="text-xl text-muted-foreground">
              {event.date} {event.time && `• ${event.time}`}
            </p>
          </header>

          {event.hero_image_url && (
            <div className="w-full aspect-[21/9] relative rounded-3xl overflow-hidden shadow-lg border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={event.hero_image_url} alt={event.title} className="absolute inset-0 w-full h-full object-cover" />
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-8 justify-center py-8 border-y border-border">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">{event.venue_name}</span>
            </div>
            <div className="hidden sm:block text-muted-foreground">•</div>
            <div className="flex items-center gap-3">
              <Banknote className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">{isFree ? "Free" : `Rs. ${event.ticket_price.toLocaleString()}`}</span>
            </div>
          </div>

          <div className="prose prose-lg dark:prose-invert mx-auto">
            {event.description?.split('\n').map((paragraph: string, i: number) => (
              <p key={i}>{paragraph}</p>
            )) || <p className="text-muted-foreground italic text-center">No description provided.</p>}
          </div>

          <div className="flex justify-center pt-8">
            <div className="w-full max-w-md bg-card p-6 rounded-2xl border border-border shadow-sm text-center">
              <h3 className="font-display text-2xl font-bold mb-4">Secure your spot</h3>
              <RegistrationWidget eventId={event.id} eventTitle={event.title} ticketTypes={ticketTypes || []} />
            </div>
          </div>
        </div>
      )}

      {/* --- CLASSIC TEMPLATE --- */}
      {template === 'classic' && (
        <div>
          <div className="theme-bg text-white py-20 px-4 text-center">
            <div className="max-w-4xl mx-auto space-y-6">
              <h1 className="font-serif text-5xl md:text-7xl font-bold">
                {event.title}
              </h1>
              <p className="text-xl md:text-2xl opacity-90 font-light">
                {event.date} | {event.venue_name}
              </p>
              <div className="inline-block mt-8 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/20">
                <span className="text-lg font-semibold">{isFree ? "Free Registration" : `Tickets: Rs. ${event.ticket_price.toLocaleString()}`}</span>
              </div>
            </div>
          </div>

          <div className="max-w-5xl mx-auto px-4 py-16">
            {event.hero_image_url && (
              <div className="mb-16 -mt-32 relative z-10 w-full aspect-video rounded-xl overflow-hidden shadow-2xl border-4 border-background">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={event.hero_image_url} alt={event.title} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-16">
              <div className="space-y-8">
                <h2 className="text-3xl font-serif font-bold border-b-2 theme-border pb-2 inline-block">Overview</h2>
                <div className="text-lg leading-relaxed text-muted-foreground space-y-4">
                  {event.description?.split('\n').map((paragraph: string, i: number) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>

                <h2 className="text-3xl font-serif font-bold border-b-2 theme-border pb-2 inline-block mt-8">Location</h2>
                <div className="text-lg text-muted-foreground space-y-2">
                  <p className="font-semibold text-foreground">{event.venue_name}</p>
                  <p>{event.venue_address}</p>
                </div>
              </div>

              <div className="space-y-8">
                <div className="bg-muted/30 p-8 rounded-xl border border-border">
                  <h2 className="text-2xl font-serif font-bold mb-6 text-center">Register Now</h2>
                  <RegistrationWidget eventId={event.id} eventTitle={event.title} ticketTypes={ticketTypes || []} />
                </div>

                {agendaItems && agendaItems.length > 0 && (
                  <div>
                    <h2 className="text-3xl font-serif font-bold border-b-2 theme-border pb-2 inline-block mb-6">Schedule</h2>
                    <div className="space-y-6">
                      {agendaItems.map((item: any) => (
                        <div key={item.id} className="bg-card p-6 rounded-xl border border-border shadow-sm">
                          <div className="flex items-center gap-3 theme-accent mb-2">
                            <Clock className="w-4 h-4" />
                            <span className="font-semibold">{item.start_time} - {item.end_time || "End"}</span>
                          </div>
                          <h3 className="text-xl font-bold mb-1">{item.title}</h3>
                          {item.speaker_name && <p className="text-muted-foreground mb-3">by {item.speaker_name}</p>}
                          {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
