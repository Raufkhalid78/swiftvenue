import { createClient } from "@/lib/supabase/server";
import { Calendar, MapPin, Clock, Banknote, ArrowUpRight, Users } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RegistrationWidget } from "@/components/registration-widget";
import { EventCountdown } from "@/components/event-countdown";
import { AddToCalendar } from "@/components/add-to-calendar";
import { SocialShare } from "@/components/social-share";
import { SaveButton } from "@/components/save-button";
import { EventWeather } from "@/components/event-weather";
import { LiveUpdatesWidget } from "@/components/live-updates";
import { headers } from "next/headers";
import { PriceDisplay } from "@/components/price-display";
import { currencyForCountry } from "@/lib/currency-map";

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
  
  const headersList = await headers();
  const detectedCountry = headersList.get('x-detected-country') || 'PK';
  
  const supabase = await createClient();
  const service = createServiceClient();

  const targetCurrency = currencyForCountry(detectedCountry);
  let exchangeRate = 1;
  if (targetCurrency !== 'PKR') {
    const { data: rate } = await service.from('exchange_rates').select('rate_from_pkr').eq('currency_code', targetCurrency).single();
    if (rate) exchangeRate = rate.rate_from_pkr;
  }

  const { data: event, error } = await service
    .from("events")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !event) {
    notFound();
  }

  if (event.status !== "published") {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== event.user_id) {
      notFound(); // Hide unpublished events from public visitors
    }
  }

  const { data: agendaItems } = await service
    .from("agenda_items")
    .select("*")
    .eq("event_id", event.id)
    .order("order_index", { ascending: true });

  let { data: ticketTypes } = await service
    .from("ticket_types")
    .select("*")
    .eq("event_id", event.id)
    .eq("is_active", true)
    .order("order_index", { ascending: true });

  // Auto-heal missing ticket types for old events that were created without one
  if (!ticketTypes || ticketTypes.length === 0) {
    const { data: newTicket } = await service.from("ticket_types").insert([
      {
        event_id: event.id,
        name: "General Admission",
        price: event.ticket_price || 0,
        currency: "PKR",
        quantity_total: 1000,
        is_active: true
      }
    ]).select().single();
    if (newTicket) {
      ticketTypes = [newTicket];
    }
  }

  const activeTickets = ticketTypes?.filter(t => t.is_active) || [];
  const lowestPrice = activeTickets.length > 0
    ? Math.min(...activeTickets.map(t => Number(t.price)))
    : (event.ticket_price || 0);
  const hasMultipleTiers = activeTickets.length > 1;
  const priceRangeLabel = hasMultipleTiers ? 'From ' : '';

  const { data: rawGallery } = await service
    .from("event_gallery")
    .select("*")
    .eq("event_id", event.id)
    .order("order_index", { ascending: true });

  const isPastEvent = new Date(`${event.date}T${event.time || '00:00'}`) < new Date();
  const gallery = rawGallery?.filter(g => isPastEvent ? true : !g.is_post_event) || [];

  const { data: speakers } = await supabase
    .from("event_speakers")
    .select("*")
    .eq("event_id", event.id)
    .order("order_index", { ascending: true });

  const { data: sponsors } = await supabase
    .from("event_sponsors")
    .select("*")
    .eq("event_id", event.id)
    .order("order_index", { ascending: true });

  const { data: faqs } = await supabase
    .from("event_faqs")
    .select("*")
    .eq("event_id", event.id)
    .order("order_index", { ascending: true });

  const { data: updates } = await supabase
    .from("event_updates")
    .select("*")
    .eq("event_id", event.id)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  const { count: attendeeCount } = await supabase
    .from('attendees')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', event.id);

  const { data: similarEvents } = await service
    .from('events')
    .select('id, title, slug, date, hero_image_url, type')
    .eq('status', 'published')
    .eq('type', event.type)
    .neq('id', event.id)
    .limit(3);

  const themeColor = event.theme_color || '#0f172a';
  const rgbTheme = hexToRgb(themeColor);
  const template = event.template_id || 'modern';
  const isFree = lowestPrice === 0 && !hasMultipleTiers;

  const { data: profile } = await service.from('profiles').select('plan').eq('id', event.user_id).single();
  const { data: planConfig } = await service.from('plans').select('remove_branding').eq('id', profile?.plan || 'free').single();
  const removeBranding = planConfig?.remove_branding || false;

  // Seating Layout
  let seatingLayout = null;
  let seats: any[] = [];
  const { data: sl } = await service.from('seating_layouts').select('id, layout_data_json').eq('event_id', event.id).single();
  if (sl) {
    seatingLayout = sl.layout_data_json;
    const { data: s } = await service.from('seats').select('*').eq('layout_id', sl.id);
    seats = s || [];
  }

  return (
    <div 
      className="min-h-screen bg-background"
      style={{
        // @ts-ignore
        '--theme-primary': rgbTheme,
      }}
    >
      <LiveUpdatesWidget updates={updates || []} eventId={event.id} />
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
              price: lowestPrice,
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
               
              <img src={event.hero_image_url} alt={event.title} className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-overlay" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-tr from-[rgba(var(--theme-primary),0.2)] to-transparent" />
            )}
            <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
              <div className="flex flex-col items-center gap-4">
                <span className="inline-block px-3 py-1 bg-background/80 backdrop-blur-md rounded-full text-sm font-medium uppercase tracking-widest text-primary">
                  {event.type} Event
                </span>
                <EventCountdown targetDate={`${event.date}T${event.time}`} />
              </div>
              <h1 className="font-display text-5xl md:text-7xl font-bold text-foreground drop-shadow-sm mt-6">
                {event.title}
              </h1>
            </div>
          </div>

          <div className="max-w-4xl mx-auto px-4 py-16">
            <div className="grid md:grid-cols-3 gap-12">
              {/* Main Content */}
              <div className="md:col-span-2 space-y-12">
                
                {/* Event Description */}
                <section>
                  <h2 className="text-2xl font-display font-semibold mb-4">About this event</h2>
                  <div className="prose prose-slate dark:prose-invert">
                    {event.description?.split('\n').map((paragraph: string, i: number) => (
                      <p key={i}>{paragraph}</p>
                    )) || <p className="text-muted-foreground italic">No description provided.</p>}
                  </div>
                </section>
                
                {/* Promo Video */}
                {event.video_url && (
                  <section className="pt-8 border-t border-border">
                    <h2 className="text-2xl font-display font-semibold mb-6">Promo Video</h2>
                    <div className="aspect-video w-full rounded-xl overflow-hidden bg-muted">
                      {event.video_url.includes('youtube.com') || event.video_url.includes('youtu.be') ? (
                        <iframe 
                          src={event.video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')} 
                          className="w-full h-full" 
                          allowFullScreen
                        />
                      ) : (
                        <video src={event.video_url} controls className="w-full h-full object-cover" />
                      )}
                    </div>
                  </section>
                )}

                {/* Speakers */}
                {speakers && speakers.length > 0 && (
                  <section className="pt-8 border-t border-border">
                    <h2 className="text-2xl font-display font-semibold mb-6">Speakers & Hosts</h2>
                    <div className="grid sm:grid-cols-2 gap-6">
                      {speakers.map((s: any) => (
                        <div key={s.id} className="flex gap-4">
                          {s.photo_url ? (
                            <img src={s.photo_url} alt={s.name} className="w-16 h-16 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-muted shrink-0" />
                          )}
                          <div>
                            <h3 className="font-bold text-foreground">{s.name}</h3>
                            {s.title && <p className="text-sm text-primary font-medium">{s.title}</p>}
                            {s.bio && <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{s.bio}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Agenda */}
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
                              <div className="text-sm text-primary font-medium mt-1">Speaker: {item.speaker_name}</div>
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
                {/* Gallery */}
                {gallery && gallery.length > 0 && (
                  <section className="pt-8 border-t border-border">
                    <h2 className="text-2xl font-display font-semibold mb-6">Gallery</h2>
                    <div className="grid grid-cols-2 gap-4">
                      {gallery.map((g: any) => (
                        <div key={g.id} className="relative aspect-square rounded-xl overflow-hidden bg-muted">
                          <img src={g.image_url} alt={g.caption || "Event image"} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* FAQ */}
                {faqs && faqs.length > 0 && (
                  <section className="pt-8 border-t border-border">
                    <h2 className="text-2xl font-display font-semibold mb-6">Frequently Asked Questions</h2>
                    <div className="space-y-6">
                      {faqs.map((f: any) => (
                        <div key={f.id}>
                          <h3 className="font-bold text-foreground mb-1">{f.question}</h3>
                          <p className="text-muted-foreground text-sm whitespace-pre-wrap">{f.answer}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <div className="flex gap-2">
                  <AddToCalendar event={event} />
                  <SocialShare title={event.title} />
                  <SaveButton eventId={event.id} />
                </div>
                
                <div className="p-6 rounded-2xl bg-card border theme-border shadow-sm">
                  <h3 className="font-semibold text-lg mb-4">When & Where</h3>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <Calendar className="w-5 h-5 text-primary shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">{event.date}</p>
                        <p className="text-sm text-muted-foreground">{event.time || "Time TBD"}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <MapPin className="w-5 h-5 text-primary shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">{event.venue_name}</p>
                        {event.venue_lat && event.venue_lng ? (
<>
<div className="mt-2 space-y-2">
                            <div className="rounded-xl overflow-hidden border border-border">
                              <iframe
                                src={`https://maps.google.com/maps?q=${event.venue_lat},${event.venue_lng}&z=15&output=embed`}
                                className="w-full aspect-video"
                                loading="lazy"
                                title={`Map showing ${event.venue_name}`}
                              />
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-sm text-muted-foreground">{event.venue_address}</p>
                              <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${event.venue_lat},${event.venue_lng}`}
                                target="_blank" rel="noopener noreferrer"
                                className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
                              >
                                Get Directions <ArrowUpRight className="w-4 h-4" />
                              </a>
                            </div>
                          </div>
                          <EventWeather lat={event.venue_lat} lng={event.venue_lng} date={event.date} />
</>
) : (
                          event.venue_address && (
                            <p className="text-sm text-muted-foreground">{event.venue_address}</p>
                          )
                        )}
                      </div>
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-border">
                      <Banknote className="w-5 h-5 text-primary shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">
                          {isFree ? "Free Entry" : <span>{priceRangeLabel}<PriceDisplay amountPkr={lowestPrice} detectedCountry={detectedCountry} /></span>}
                        </p>
                        <p className="text-sm text-muted-foreground">Ticket Price</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-2xl border border-border p-1">
                  <RegistrationWidget eventId={event.id} eventTitle={event.title} ticketTypes={ticketTypes || []} targetCurrency={targetCurrency} exchangeRate={exchangeRate} seatingLayout={seatingLayout} seats={seats} />
                  {attendeeCount !== null && attendeeCount >= 3 && (
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5 pb-2">
                      <Users className="w-4 h-4" />
                      {attendeeCount} people are going
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2 pb-2 text-center px-4">
                    Refunds available up to 48 hours before the event. <Link href="/terms#refunds" className="underline">View refund policy</Link>
                  </p>
                </div>

                {/* Organizer Info */}
                {event.organizer_bio && (
                  <div className="p-6 rounded-2xl bg-muted/30 border border-border">
                    <h3 className="font-semibold text-lg mb-2">About the Organizer</h3>
                    <p className="text-sm text-muted-foreground">{event.organizer_bio}</p>
                  </div>
                )}

                {/* Sponsors */}
                {sponsors && sponsors.length > 0 && (
                  <div className="p-6 rounded-2xl bg-card border border-border">
                    <h3 className="font-semibold text-lg mb-4 text-center">Sponsored By</h3>
                    <div className="flex flex-wrap gap-4 justify-center">
                      {sponsors.map((s: any) => (
                        <div key={s.id} className="w-20 h-12 relative flex items-center justify-center grayscale hover:grayscale-0 transition-all opacity-70 hover:opacity-100">
                          <img src={s.logo_url} alt={s.name} className="max-w-full max-h-full object-contain" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* --- MINIMALIST TEMPLATE --- */}
      {template === 'minimalist' && (
        <div className="max-w-3xl mx-auto px-4 py-16 sm:py-24 space-y-16">
          <header className="text-center space-y-6">
            <div className="flex justify-center mb-4">
              <EventCountdown targetDate={`${event.date}T${event.time}`} />
            </div>
            <h1 className="font-display text-5xl sm:text-6xl font-bold tracking-tight text-foreground">
              {event.title}
            </h1>
            <p className="text-xl text-muted-foreground">
              {event.date} {event.time && `• ${event.time}`}
            </p>
            <div className="flex justify-center gap-2 mt-4">
              <AddToCalendar event={event} />
              <SocialShare title={event.title} />
              <SaveButton eventId={event.id} />
            </div>
          </header>

          {event.hero_image_url && (
            <div className="w-full aspect-[21/9] relative rounded-3xl overflow-hidden shadow-lg border border-border">
              <img src={event.hero_image_url} alt={event.title} className="absolute inset-0 w-full h-full object-cover" />
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-8 justify-center py-8 border-y border-border w-full">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium flex flex-col">
                {event.venue_name}
                {event.venue_address && <span className="text-sm text-muted-foreground font-normal mt-1">{event.venue_address}</span>}
                {event.venue_lat && event.venue_lng && (
<>
<div className="mt-2 space-y-2 max-w-sm">
                    <div className="rounded-xl overflow-hidden border border-border">
                      <iframe
                        src={`https://maps.google.com/maps?q=${event.venue_lat},${event.venue_lng}&z=15&output=embed`}
                        className="w-full aspect-video"
                        loading="lazy"
                        title={`Map showing ${event.venue_name}`}
                      />
                    </div>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${event.venue_lat},${event.venue_lng}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1 mt-1"
                    >
                      Get Directions <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </div>
                  <EventWeather lat={event.venue_lat} lng={event.venue_lng} date={event.date} />
</>
)}
              </span>
            </div>
            <div className="hidden sm:block text-muted-foreground">•</div>
            <div className="flex items-center gap-3">
              <Banknote className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">{isFree ? "Free" : <span>{priceRangeLabel}<PriceDisplay amountPkr={lowestPrice} detectedCountry={detectedCountry} /></span>}</span>
            </div>
          </div>

          <div className="prose prose-lg dark:prose-invert mx-auto">
            {event.description?.split('\n').map((paragraph: string, i: number) => (
              <p key={i}>{paragraph}</p>
            )) || <p className="text-muted-foreground italic text-center">No description provided.</p>}
          </div>

          {event.video_url && (
            <div className="mx-auto w-full aspect-video rounded-2xl overflow-hidden bg-muted">
              {event.video_url.includes('youtube.com') || event.video_url.includes('youtu.be') ? (
                <iframe src={event.video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')} className="w-full h-full" allowFullScreen />
              ) : (
                <video src={event.video_url} controls className="w-full h-full object-cover" />
              )}
            </div>
          )}

          {speakers && speakers.length > 0 && (
            <div className="mx-auto max-w-2xl border-t border-border pt-12">
              <h2 className="text-2xl font-display font-semibold mb-8 text-center">Speakers</h2>
              <div className="space-y-6">
                {speakers.map((s: any) => (
                  <div key={s.id} className="flex gap-6 items-center p-4 rounded-xl hover:bg-muted/30 transition-colors">
                    {s.photo_url ? (
                      <img src={s.photo_url} alt={s.name} className="w-20 h-20 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-muted shrink-0" />
                    )}
                    <div>
                      <h3 className="text-lg font-bold">{s.name}</h3>
                      {s.title && <p className="text-muted-foreground">{s.title}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {agendaItems && agendaItems.length > 0 && (
            <div className="mx-auto max-w-2xl border-t border-border pt-12">
              <h2 className="text-2xl font-display font-semibold mb-8 text-center">Schedule</h2>
              <div className="space-y-4">
                {agendaItems.map((item: any) => (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 border border-border rounded-xl">
                    <div className="font-semibold text-foreground">{item.title}</div>
                    <div className="text-sm text-muted-foreground mt-2 sm:mt-0 font-medium">
                      {item.start_time} - {item.end_time || "End"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {gallery && gallery.length > 0 && (
            <div className="mx-auto border-t border-border pt-12">
              <h2 className="text-2xl font-display font-semibold mb-8 text-center">Gallery</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {gallery.map((g: any) => (
                  <img key={g.id} src={g.image_url} alt="Gallery image" className="aspect-square w-full object-cover rounded-xl" />
                ))}
              </div>
            </div>
          )}

          {faqs && faqs.length > 0 && (
            <div className="mx-auto max-w-2xl border-t border-border pt-12">
              <h2 className="text-2xl font-display font-semibold mb-8 text-center">FAQ</h2>
              <div className="space-y-8">
                {faqs.map((f: any) => (
                  <div key={f.id} className="text-center space-y-2">
                    <h3 className="font-bold">{f.question}</h3>
                    <p className="text-muted-foreground">{f.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sponsors && sponsors.length > 0 && (
            <div className="mx-auto max-w-2xl border-t border-border pt-12">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-6 text-center">Supported By</h2>
              <div className="flex flex-wrap justify-center gap-8">
                {sponsors.map((s: any) => (
                  <img key={s.id} src={s.logo_url} alt={s.name} className="h-10 object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all" />
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center pt-8 border-t border-border">
            <div className="w-full max-w-md bg-card p-6 rounded-2xl border border-border shadow-sm text-center">
              <h3 className="font-display text-2xl font-bold mb-4">Secure your spot</h3>
              <RegistrationWidget eventId={event.id} eventTitle={event.title} ticketTypes={ticketTypes || []} targetCurrency={targetCurrency} exchangeRate={exchangeRate} seatingLayout={seatingLayout} seats={seats} />
              {attendeeCount !== null && attendeeCount >= 3 && (
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5 mt-4">
                  <Users className="w-4 h-4" />
                  {attendeeCount} people are going
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-4 text-center">
                Refunds available up to 48 hours before the event. <Link href="/terms#refunds" className="underline">View refund policy</Link>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* --- CLASSIC TEMPLATE --- */}
      {template === 'classic' && (
        <div>
          <div className="theme-bg text-white py-20 px-4 text-center">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex justify-center mb-6">
                <EventCountdown targetDate={`${event.date}T${event.time}`} />
              </div>
              <h1 className="font-serif text-5xl md:text-7xl font-bold">
                {event.title}
              </h1>
              <p className="text-xl md:text-2xl opacity-90 font-light">
                {event.date} | {event.venue_name}
              </p>
              <div className="flex justify-center gap-4 mt-8">
                <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/20">
                  <span className="text-lg font-semibold">{isFree ? "Free Registration" : <div className="inline-flex items-center gap-2">Tickets: {priceRangeLabel}<PriceDisplay amountPkr={lowestPrice} detectedCountry={detectedCountry} /></div>}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                  <AddToCalendar event={event} />
                  <SocialShare title={event.title} />
                  <SaveButton eventId={event.id} />
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-5xl mx-auto px-4 py-16">
            {event.hero_image_url && (
              <div className="mb-16 -mt-32 relative z-10 w-full aspect-video rounded-xl overflow-hidden shadow-2xl border-4 border-background">
                <img src={event.hero_image_url} alt={event.title} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-16">
              <div className="space-y-12">
                <div>
                  <h2 className="text-3xl font-serif font-bold border-b-2 theme-border pb-2 inline-block">Overview</h2>
                  <div className="text-lg leading-relaxed text-muted-foreground space-y-4 mt-6">
                    {event.description?.split('\n').map((paragraph: string, i: number) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                  </div>
                </div>
                {event.additional_info && (
                  <div className="mt-8 bg-muted/30 p-6 rounded-xl border border-border">
                    <h3 className="font-semibold text-lg mb-3">Important Information</h3>
                    <div className="prose prose-sm dark:prose-invert text-muted-foreground">
                      {event.additional_info.split('\n').map((paragraph: string, i: number) => (
                        <p key={i}>{paragraph}</p>
                      ))}
                    </div>
                  </div>
                )}

                {event.video_url && (
                  <div>
                    <h2 className="text-3xl font-serif font-bold border-b-2 theme-border pb-2 inline-block">Promo Video</h2>
                    <div className="mt-6 aspect-video w-full rounded-xl overflow-hidden bg-muted shadow-md">
                      {event.video_url.includes('youtube.com') || event.video_url.includes('youtu.be') ? (
                        <iframe src={event.video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')} className="w-full h-full" allowFullScreen />
                      ) : (
                        <video src={event.video_url} controls className="w-full h-full object-cover" />
                      )}
                    </div>
                  </div>
                )}

                {speakers && speakers.length > 0 && (
                  <div>
                    <h2 className="text-3xl font-serif font-bold border-b-2 theme-border pb-2 inline-block">Speakers</h2>
                    <div className="grid sm:grid-cols-2 gap-6 mt-6">
                      {speakers.map((s: any) => (
                        <div key={s.id} className="flex gap-4">
                          {s.photo_url ? (
                            <img src={s.photo_url} alt={s.name} className="w-16 h-16 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-muted shrink-0" />
                          )}
                          <div>
                            <h3 className="font-bold text-foreground text-lg">{s.name}</h3>
                            {s.title && <p className="text-sm text-primary font-medium">{s.title}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h2 className="text-3xl font-serif font-bold border-b-2 theme-border pb-2 inline-block">Location</h2>
                  <div className="text-lg text-muted-foreground space-y-4 mt-6">
                    <p className="font-semibold text-foreground">{event.venue_name}</p>
                    {event.venue_lat && event.venue_lng ? (
<>
<div className="space-y-3">
                        <div className="rounded-xl overflow-hidden border border-border w-full aspect-video">
                          <iframe
                            src={`https://maps.google.com/maps?q=${event.venue_lat},${event.venue_lng}&z=15&output=embed`}
                            className="w-full h-full"
                            loading="lazy"
                            title={`Map showing ${event.venue_name}`}
                          />
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <p>{event.venue_address}</p>
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${event.venue_lat},${event.venue_lng}`}
                            target="_blank" rel="noopener noreferrer"
                            className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
                          >
                            Get Directions <ArrowUpRight className="w-4 h-4" />
                          </a>
                        </div>
                        <EventWeather lat={event.venue_lat} lng={event.venue_lng} date={event.date} />
</div>
</>
) : (
                      <p>{event.venue_address}</p>
                    )}
                  </div>
                </div>
                
                {faqs && faqs.length > 0 && (
                  <div>
                    <h2 className="text-3xl font-serif font-bold border-b-2 theme-border pb-2 inline-block">FAQ</h2>
                    <div className="space-y-6 mt-6">
                      {faqs.map((f: any) => (
                        <div key={f.id} className="bg-muted/30 p-6 rounded-xl">
                          <h3 className="font-bold text-foreground mb-2 text-lg">{f.question}</h3>
                          <p className="text-muted-foreground whitespace-pre-wrap">{f.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              <div className="space-y-12">
                <div className="bg-muted/30 p-8 rounded-xl border border-border">
                  <h2 className="text-2xl font-serif font-bold mb-6 text-center">Register Now</h2>
                  <RegistrationWidget eventId={event.id} eventTitle={event.title} ticketTypes={ticketTypes || []} targetCurrency={targetCurrency} exchangeRate={exchangeRate} seatingLayout={seatingLayout} seats={seats} />
                  {attendeeCount !== null && attendeeCount >= 3 && (
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5 mt-4">
                      <Users className="w-4 h-4" />
                      {attendeeCount} people are going
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-4 text-center">
                    Refunds available up to 48 hours before the event. <Link href="/terms#refunds" className="underline">View refund policy</Link>
                  </p>
                </div>

                {agendaItems && agendaItems.length > 0 && (
                  <div>
                    <h2 className="text-3xl font-serif font-bold border-b-2 theme-border pb-2 inline-block mb-6">Schedule</h2>
                    <div className="space-y-6">
                      {agendaItems.map((item: any) => (
                        <div key={item.id} className="bg-card p-6 rounded-xl border border-border shadow-sm">
                          <div className="flex items-center gap-3 text-primary mb-2">
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

                {gallery && gallery.length > 0 && (
                  <div>
                    <h2 className="text-3xl font-serif font-bold border-b-2 theme-border pb-2 inline-block mb-6">Gallery</h2>
                    <div className="grid grid-cols-2 gap-4">
                      {gallery.map((g: any) => (
                        <img key={g.id} src={g.image_url} alt="Gallery image" className="aspect-square w-full object-cover rounded-xl shadow-sm" />
                      ))}
                    </div>
                  </div>
                )}

                {sponsors && sponsors.length > 0 && (
                  <div>
                    <h2 className="text-3xl font-serif font-bold border-b-2 theme-border pb-2 inline-block mb-6">Sponsors</h2>
                    <div className="bg-card p-6 rounded-xl border border-border shadow-sm flex flex-wrap gap-6 justify-center">
                      {sponsors.map((s: any) => (
                        <div key={s.id} className="w-24 h-16 relative flex items-center justify-center">
                          <img src={s.logo_url} alt={s.name} className="max-w-full max-h-full object-contain" />
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

      {/* --- FESTIVAL TEMPLATE --- */}
      {template === 'festival' && (
        <div className="bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-transparent min-h-screen">
          <div className="max-w-6xl mx-auto px-4 py-12 space-y-16">
            <header className="relative">
              <div className="absolute inset-0 -z-10 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
              {event.hero_image_url && (
                <div className="w-full h-[60vh] rounded-[2rem] overflow-hidden mb-8 relative rotate-[-1deg] shadow-2xl border-4 border-white/10">
                  <img src={event.hero_image_url} alt={event.title} className="w-full h-full object-cover scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                  <div className="absolute bottom-10 left-10 right-10">
                    <h1 className="font-display text-6xl sm:text-8xl font-black text-white drop-shadow-lg tracking-tighter uppercase">
                      {event.title}
                    </h1>
                    <div className="flex flex-wrap gap-4 mt-6 items-center">
                      <div className="bg-primary text-primary-foreground px-6 py-2 rounded-full font-bold text-lg rotate-[2deg] shadow-lg">
                        {event.date}
                      </div>
                      <div className="bg-white text-black px-6 py-2 rounded-full font-bold text-lg rotate-[-1deg] shadow-lg flex gap-2">
                        <MapPin className="w-5 h-5" /> {event.venue_name}
                      </div>
                      <SocialShare title={event.title} />
                      <SaveButton eventId={event.id} />
                    </div>
                  </div>
                </div>
              )}
            </header>

            <div className="grid lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-16">
                <section className="bg-background/80 backdrop-blur-xl p-8 rounded-[2rem] border border-border shadow-xl rotate-[1deg]">
                  <h2 className="text-4xl font-black uppercase mb-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">The Vibe</h2>
                  <div className="prose prose-lg dark:prose-invert font-medium">
                    {event.description?.split('\n').map((paragraph: string, i: number) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                  </div>
                  {event.additional_info && (
                    <div className="mt-8 bg-muted/50 p-6 rounded-xl border border-border">
                      <h3 className="font-semibold text-lg mb-3">Important Information</h3>
                      <div className="prose prose-sm dark:prose-invert">
                        {event.additional_info.split('\n').map((paragraph: string, i: number) => (
                          <p key={i}>{paragraph}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </section>

                {speakers && speakers.length > 0 && (
                  <section>
                    <h2 className="text-4xl font-black uppercase mb-8 text-center rotate-[-2deg]">Lineup</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                      {speakers.map((s: any) => (
                        <div key={s.id} className="text-center group">
                          <div className="aspect-square rounded-3xl overflow-hidden mb-4 rotate-[2deg] group-hover:rotate-0 transition-transform shadow-lg border-2 theme-border">
                            {s.photo_url ? (
                              <img src={s.photo_url} alt={s.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full bg-muted" />
                            )}
                          </div>
                          <h3 className="font-black text-xl uppercase">{s.name}</h3>
                          {s.title && <p className="text-sm theme-accent font-bold mt-1">{s.title}</p>}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {gallery && gallery.length > 0 && (
                  <section>
                    <h2 className="text-4xl font-black uppercase mb-8 rotate-[1deg]">Moments</h2>
                    <div className="columns-2 sm:columns-3 gap-4 space-y-4">
                      {gallery.map((g: any, i: number) => (
                        <div key={g.id} className={`rounded-2xl overflow-hidden shadow-lg ${i % 2 === 0 ? 'rotate-[2deg]' : 'rotate-[-2deg]'}`}>
                          <img src={g.image_url} alt="Gallery" className="w-full" />
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              <div className="space-y-8">
                <div className="sticky top-8">
                  <div className="bg-background rounded-[2rem] border-[4px] border-primary p-6 shadow-2xl rotate-[-1deg]">
                    <h2 className="text-3xl font-black uppercase mb-6 text-center">Get Tickets</h2>
                    <RegistrationWidget eventId={event.id} eventTitle={event.title} ticketTypes={ticketTypes || []} targetCurrency={targetCurrency} exchangeRate={exchangeRate} />
                    {attendeeCount !== null && attendeeCount >= 3 && (
                      <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5 mt-4">
                        <Users className="w-4 h-4" />
                        {attendeeCount} people are going
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-4 text-center">
                      Refunds available up to 48 hours before the event. <Link href="/terms#refunds" className="underline">View refund policy</Link>
                    </p>
                  </div>

                  {sponsors && sponsors.length > 0 && (
                    <div className="mt-12 text-center">
                      <h3 className="text-lg font-bold uppercase tracking-widest text-muted-foreground mb-6">Partners</h3>
                      <div className="flex flex-wrap justify-center gap-6 opacity-70">
                        {sponsors.map((s: any) => (
                          <img key={s.id} src={s.logo_url} alt={s.name} className="h-12 object-contain mix-blend-luminosity hover:mix-blend-normal transition-all" />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-12 bg-background/80 backdrop-blur-xl rounded-[2rem] border-[4px] border-border p-6 shadow-2xl rotate-[1deg]">
                    <h3 className="text-2xl font-black uppercase mb-4 text-center">Location</h3>
                    <p className="font-bold text-center mb-2">{event.venue_name}</p>
                    {event.venue_lat && event.venue_lng ? (
<>
<div className="space-y-3">
                        <div className="rounded-2xl overflow-hidden border-2 border-border w-full aspect-video">
                          <iframe
                            src={`https://maps.google.com/maps?q=${event.venue_lat},${event.venue_lng}&z=15&output=embed`}
                            className="w-full h-full"
                            loading="lazy"
                            title={`Map showing ${event.venue_name}`}
                          />
                        </div>
                        <div className="flex flex-col gap-2 text-center">
                          <p className="text-sm text-muted-foreground">{event.venue_address}</p>
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${event.venue_lat},${event.venue_lng}`}
                            target="_blank" rel="noopener noreferrer"
                            className="text-sm font-black uppercase text-primary hover:underline inline-flex items-center justify-center gap-1"
                          >
                            Get Directions <ArrowUpRight className="w-4 h-4" />
                          </a>
                        </div>
                        <EventWeather lat={event.venue_lat} lng={event.venue_lng} date={event.date} />
</div>
</>
) : (
                      <p className="text-sm text-center text-muted-foreground">{event.venue_address}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- GALA TEMPLATE --- */}
      {template === 'gala' && (
        <div className="bg-zinc-950 text-zinc-100 min-h-screen font-serif">
          <div className="max-w-4xl mx-auto px-4 py-24 space-y-24">
            <header className="text-center space-y-8">
              <div className="flex justify-center mb-12">
                <div className="w-16 h-1 bg-yellow-600/60 rounded-full" />
              </div>
              <h1 className="text-5xl sm:text-7xl font-light tracking-wide leading-tight">
                {event.title}
              </h1>
              <div className="flex items-center justify-center gap-4 text-zinc-400 text-lg">
                <span>{event.date}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-600/40" />
                <span>{event.venue_name}</span>
              </div>
              <div className="flex justify-center gap-4 pt-8">
                <AddToCalendar event={event} />
                <SocialShare title={event.title} />
                <SaveButton eventId={event.id} />
              </div>
            </header>

            {event.hero_image_url && (
              <div className="relative aspect-[16/7] rounded-sm overflow-hidden">
                <img src={event.hero_image_url} alt="Hero" className="w-full h-full object-cover" />
                <div className="absolute inset-0 border border-white/10 mix-blend-overlay" />
              </div>
            )}

            <div className="grid md:grid-cols-12 gap-16">
              <div className="md:col-span-7 space-y-16">
                <section>
                  <h2 className="text-2xl font-light uppercase tracking-widest text-yellow-600 mb-8">The Evening</h2>
                  <div className="space-y-6 text-lg text-zinc-300 leading-relaxed font-light">
                    {event.description?.split('\n').map((p: string, i: number) => <p key={i}>{p}</p>)}
                  </div>
                  {event.additional_info && (
                    <div className="mt-12 pt-8 border-t border-zinc-800/50">
                      <h3 className="text-lg font-medium text-zinc-100 mb-4">Important Information</h3>
                      <div className="space-y-4 text-zinc-400 font-light">
                        {event.additional_info.split('\n').map((p: string, i: number) => <p key={i}>{p}</p>)}
                      </div>
                    </div>
                  )}
                </section>

                {agendaItems && agendaItems.length > 0 && (
                  <section>
                    <h2 className="text-2xl font-light uppercase tracking-widest text-yellow-600 mb-8">Program</h2>
                    <div className="space-y-8">
                      {agendaItems.map((item: any) => (
                        <div key={item.id} className="border-b border-zinc-800 pb-8 last:border-0">
                          <div className="text-yellow-600/80 mb-2 font-mono text-sm tracking-wider">{item.start_time} - {item.end_time || "Concludes"}</div>
                          <h3 className="text-xl font-medium mb-2">{item.title}</h3>
                          {item.speaker_name && <p className="text-zinc-400 italic">Featuring {item.speaker_name}</p>}
                          {item.description && <p className="text-zinc-500 mt-3 text-sm">{item.description}</p>}
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              <div className="md:col-span-5 space-y-16">
                <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-sm">
                  <h2 className="text-2xl font-light text-center mb-8">RSVP</h2>
                  <RegistrationWidget eventId={event.id} eventTitle={event.title} ticketTypes={ticketTypes || []} targetCurrency={targetCurrency} exchangeRate={exchangeRate} />
                  {attendeeCount !== null && attendeeCount >= 3 && (
                    <p className="text-sm text-zinc-400 flex items-center justify-center gap-1.5 mt-6">
                      <Users className="w-4 h-4" />
                      {attendeeCount} people are going
                    </p>
                  )}
                  <p className="text-xs text-zinc-500 mt-4 text-center">
                    Refunds available up to 48 hours before the event. <Link href="/terms#refunds" className="underline">View refund policy</Link>
                  </p>
                </div>
                
                <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-sm mt-8">
                  <h2 className="text-2xl font-light text-center mb-6">Location</h2>
                  <div className="text-center space-y-4">
                    <p className="font-medium text-zinc-200">{event.venue_name}</p>
                    {event.venue_lat && event.venue_lng ? (
<>
<div className="space-y-4">
                        <div className="rounded-sm overflow-hidden border border-zinc-800 w-full aspect-video opacity-80 hover:opacity-100 transition-opacity">
                          <iframe
                            src={`https://maps.google.com/maps?q=${event.venue_lat},${event.venue_lng}&z=15&output=embed`}
                            className="w-full h-full"
                            loading="lazy"
                            title={`Map showing ${event.venue_name}`}
                          />
                        </div>
                        <p className="text-sm text-zinc-400">{event.venue_address}</p>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${event.venue_lat},${event.venue_lng}`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-sm tracking-wider uppercase text-yellow-600 hover:text-yellow-500 transition-colors inline-flex items-center gap-2"
                        >
                          Get Directions <ArrowUpRight className="w-4 h-4" />
                        </a>
                        <EventWeather lat={event.venue_lat} lng={event.venue_lng} date={event.date} />
</div>
</>
) : (
                      <p className="text-sm text-zinc-400">{event.venue_address}</p>
                    )}
                  </div>
                </div>

                {sponsors && sponsors.length > 0 && (
                  <div className="text-center">
                    <h3 className="text-sm font-light uppercase tracking-widest text-zinc-500 mb-8">Benefactors</h3>
                    <div className="space-y-8">
                      {sponsors.map((s: any) => (
                        <div key={s.id} className="flex justify-center">
                          <img src={s.logo_url} alt={s.name} className="h-16 object-contain grayscale opacity-50" />
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

      {/* --- WORKSHOP TEMPLATE --- */}
      {template === 'workshop' && (
        <div className="min-h-screen bg-slate-50">
          <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
            <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-bold text-xl text-slate-900">{event.title}</h1>
                <p className="text-sm text-slate-500 flex items-center gap-2">
                  <Calendar className="w-3 h-3" /> {event.date}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <EventCountdown targetDate={`${event.date}T${event.time}`} />
                <AddToCalendar event={event} />
                <SocialShare title={event.title} />
                <SaveButton eventId={event.id} />
              </div>
            </div>
          </header>

          <div className="max-w-5xl mx-auto px-4 py-8 grid md:grid-cols-12 gap-8">
            <div className="md:col-span-8 space-y-6">
              {event.hero_image_url && (
                <div className="w-full aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                  <img src={event.hero_image_url} alt="Workshop header" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                <h2 className="text-lg font-bold border-b border-slate-100 pb-2 mb-4">About the Session</h2>
                <div className="prose prose-sm prose-slate max-w-none">
                  {event.description?.split('\n').map((p: string, i: number) => <p key={i}>{p}</p>)}
                </div>
                {event.additional_info && (
                  <div className="mt-8 bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 mb-2">Important Information</h3>
                    <div className="prose prose-sm prose-slate max-w-none text-slate-600">
                      {event.additional_info.split('\n').map((p: string, i: number) => <p key={i}>{p}</p>)}
                    </div>
                  </div>
                )}
              </div>

              {agendaItems && agendaItems.length > 0 && (
                <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                  <h2 className="text-lg font-bold border-b border-slate-100 pb-2 mb-4">Agenda</h2>
                  <div className="relative border-l-2 border-slate-100 ml-3 space-y-6">
                    {agendaItems.map((item: any) => (
                      <div key={item.id} className="relative pl-6">
                        <div className="absolute w-3 h-3 bg-white border-2 border-primary rounded-full -left-[7px] top-1.5" />
                        <div className="text-sm font-semibold text-primary mb-1">{item.start_time} - {item.end_time || 'End'}</div>
                        <h3 className="font-bold text-slate-900">{item.title}</h3>
                        {item.speaker_name && <p className="text-sm text-slate-600 mt-1">Led by: {item.speaker_name}</p>}
                        {item.description && <p className="text-sm text-slate-500 mt-2">{item.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="md:col-span-4 space-y-6">
              <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                <h2 className="text-lg font-bold border-b border-slate-100 pb-2 mb-4">Registration</h2>
                <RegistrationWidget eventId={event.id} eventTitle={event.title} ticketTypes={ticketTypes || []} targetCurrency={targetCurrency} exchangeRate={exchangeRate} />
                {attendeeCount !== null && attendeeCount >= 3 && (
                  <p className="text-sm text-slate-500 flex items-center justify-center gap-1.5 mt-4">
                    <Users className="w-4 h-4" />
                    {attendeeCount} people are going
                  </p>
                )}
                <p className="text-xs text-slate-400 mt-4 text-center">
                  Refunds available up to 48 hours before the event. <Link href="/terms#refunds" className="underline">View refund policy</Link>
                </p>
              </div>

              {speakers && speakers.length > 0 && (
                <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                  <h2 className="text-lg font-bold border-b border-slate-100 pb-2 mb-4">Instructors</h2>
                  <div className="space-y-4">
                    {speakers.map((s: any) => (
                      <div key={s.id} className="flex gap-3">
                        {s.photo_url ? (
                          <img src={s.photo_url} alt={s.name} className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-slate-100" />
                        )}
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{s.name}</div>
                          <div className="text-xs text-slate-500">{s.title}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                <h2 className="text-lg font-bold border-b border-slate-100 pb-2 mb-4">Details</h2>
                <div className="space-y-4 text-sm">
                  <div className="flex gap-3">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="w-full">
                      <div className="font-medium text-slate-900">{event.venue_name}</div>
                      {event.venue_lat && event.venue_lng ? (
<>
<div className="mt-3 space-y-3">
                          <div className="rounded-lg overflow-hidden border border-slate-200 w-full aspect-video">
                            <iframe
                              src={`https://maps.google.com/maps?q=${event.venue_lat},${event.venue_lng}&z=15&output=embed`}
                              className="w-full h-full"
                              loading="lazy"
                              title={`Map showing ${event.venue_name}`}
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <div className="text-slate-500">{event.venue_address}</div>
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${event.venue_lat},${event.venue_lng}`}
                              target="_blank" rel="noopener noreferrer"
                              className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
                            >
                              Get Directions <ArrowUpRight className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                        <EventWeather lat={event.venue_lat} lng={event.venue_lng} date={event.date} />
</>
) : (
                        <div className="text-slate-500 mt-1">{event.venue_address}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- SIMILAR EVENTS --- */}
      {similarEvents && similarEvents.length > 0 && (
        <section className="bg-background pt-12 pb-24 border-t border-border">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl font-display font-semibold mb-6 text-foreground">You Might Also Like</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {similarEvents.map((e: any) => (
                <Link key={e.id} href={`/e/${e.slug}`} className="group block">
                  <div className="aspect-video rounded-xl overflow-hidden mb-3 bg-muted border border-border">
                    {e.hero_image_url ? (
                      <img src={e.hero_image_url} alt={e.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Calendar className="w-8 h-8 opacity-20" />
                      </div>
                    )}
                  </div>
                  <p className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">{e.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{e.date}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
      
      {!removeBranding && (
        <div className="w-full text-center py-8 border-t border-border bg-background">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <span className="font-medium">Powered by</span>
            <img src="/logo.jpg" alt="SwiftVenue Logo" className="w-5 h-5 rounded-sm grayscale" />
            <span className="font-bold font-display tracking-tight text-base">SwiftVenue</span>
          </Link>
        </div>
      )}

    </div>
  );
}
