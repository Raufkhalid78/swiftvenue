import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { MapPin, Calendar, Search, Tag } from "lucide-react";
import { headers } from "next/headers";
import { PriceDisplay } from "@/components/price-display";
import { CurrencySwitcher } from "@/components/currency-switcher";
import { currencyForCountry } from "@/lib/currency-map";

export const revalidate = 60; // Revalidate every minute

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Events Directory — SwiftVenue",
  description: "Find and book tickets for the best corporate, social, and cultural events happening near you.",
  alternates: { canonical: "https://www.swiftvenuehq.com/events" },
};

export default async function EventsDirectory({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;

  const headersList = await headers();
  const detectedCountry = headersList.get('x-detected-country') || 'PK';

  const supabase = await createClient();

  let query = supabase
    .from("events")
    .select("id, title, slug, type, description, date, time, venue_name, venue_address, hero_image_url, theme_color, ticket_price, ticket_types(price, is_active)")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (category && category !== "all") {
    query = query.eq("type", category);
  }
  
  if (q) {
    query = query.ilike("title", `%${q}%`);
  }

  const { data: events, error } = await query;

  if (error) {
    console.error("Error fetching events:", error);
  }

  const categories = ["all", "corporate", "social", "cultural", "educational"];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-primary/5 py-16 px-4 border-b border-border relative">
        <div className="absolute top-4 right-4">
          <CurrencySwitcher defaultCurrency={detectedCountry && currencyForCountry(detectedCountry)} />
        </div>
        <div className="max-w-6xl mx-auto text-center space-y-4">
          <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight">
            Discover Upcoming Events
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Find and book tickets for the best corporate, social, and cultural events happening near you.
          </p>
          
          <div className="mt-8 max-w-2xl mx-auto pt-4 flex flex-col md:flex-row gap-3">
            <form action="/events" method="GET" className="flex-1 flex gap-2">
              {category && <input type="hidden" name="category" value={category} />}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input 
                  type="text" 
                  name="q"
                  defaultValue={q || ""}
                  placeholder="Search events by name..." 
                  className="w-full h-12 pl-10 pr-4 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary outline-none transition-all"
                />
              </div>
              <button type="submit" className="h-12 px-6 bg-primary text-primary-foreground font-medium rounded-xl hover:opacity-90 transition-opacity">
                Search
              </button>
            </form>
          </div>
          
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {categories.map((c) => (
              <Link 
                key={c}
                href={`/events?category=${c}${q ? `&q=${q}` : ''}`}
                className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors ${
                  (category || "all") === c 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-background border border-border hover:bg-muted text-foreground"
                }`}
              >
                {c}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {!events || events.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-2xl bg-muted/20">
            <h3 className="text-xl font-semibold mb-2">No events found</h3>
            <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
            <Link href="/events" className="inline-block mt-4 text-primary hover:underline font-medium">
              Clear all filters
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              // Calculate starting price
              let startingPrice = event.ticket_price || 0;
              if (event.ticket_types && event.ticket_types.length > 0) {
                const activeTiers = event.ticket_types.filter((t: any) => t.is_active);
                if (activeTiers.length > 0) {
                  startingPrice = Math.min(...activeTiers.map((t: any) => Number(t.price)));
                }
              }
              const isFree = startingPrice <= 0;

              return (
                <Link key={event.id} href={`/e/${event.slug}`} className="group block h-full">
                  <div className="bg-card rounded-2xl border border-border overflow-hidden h-full flex flex-col hover:shadow-lg transition-shadow duration-300">
                    <div className="w-full aspect-[4/3] bg-muted relative overflow-hidden">
                      {event.hero_image_url ? (
                         
                        <img 
                          src={event.hero_image_url} 
                          alt={event.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-primary/20 to-primary/5 flex items-center justify-center">
                          <Tag className="w-12 h-12 text-primary/30" />
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-background/90 backdrop-blur-sm border border-border text-xs font-semibold uppercase tracking-wider rounded-full shadow-sm">
                          {event.type}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-6 flex flex-col flex-1">
                      <h3 className="font-display font-semibold text-xl mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {event.title}
                      </h3>
                      
                      <div className="space-y-2 mt-2 mb-6">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>{event.date} {event.time && `• ${event.time}`}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4 shrink-0" />
                          <span className="truncate">{event.venue_name || event.venue_address || "TBD"}</span>
                        </div>
                      </div>

                      <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                        <div className="font-semibold text-lg">
                          {isFree ? "Free" : <div className="inline-flex gap-1 items-center">From <PriceDisplay amountPkr={startingPrice} detectedCountry={detectedCountry} /></div>}
                        </div>
                        <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                          Get Tickets
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
}
