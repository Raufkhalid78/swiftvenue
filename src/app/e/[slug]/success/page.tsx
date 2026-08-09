import Link from "next/link";
import { CheckCircle, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WalletButtons } from "@/components/wallet-buttons";
import { createClient } from "@/lib/supabase/server";

export default async function SuccessPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ slug: string }>,
  searchParams: Promise<{ order?: string }>
}) {
  const supabase = await createClient();
  const { slug } = await params;
  const search = await searchParams;
  const orderId = search.order || 'demo-order-id';

  // Fetch order to get referral code
  let referralCode = null;
  if (orderId && orderId !== 'demo-order-id') {
    const { data: order } = await supabase.from('orders').select('referral_code').eq('id', orderId).single();
    if (order) referralCode = order.referral_code;
  }

  // Fetch similar events (published, not this one)
  const { data: similarEvents } = await supabase
    .from("events")
    .select("title, slug, date, hero_image_url, venue_name, theme_color")
    .eq("status", "published")
    .neq("slug", slug)
    .limit(3);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-20 px-4">
      <div className="bg-card border border-border max-w-md w-full rounded-2xl shadow-sm p-8 text-center animate-in zoom-in-95 duration-500 fade-in">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-emerald-500" />
        </div>
        <h1 className="font-display text-3xl font-bold mb-2">Registration Successful!</h1>
        <p className="text-muted-foreground mb-6">
          You have successfully registered for the event. Your ticket has been sent to your email.
        </p>

        <div className="border-t border-b border-border py-6 mb-6">
          <h3 className="font-semibold mb-4">Save your ticket to your phone</h3>
          <WalletButtons orderId={orderId} />
        </div>

        {referralCode && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-primary mb-2">Invite Friends & Earn</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Share this code with friends. They get 10% off, and you earn rewards!
            </p>
            <div className="bg-background border border-border rounded-lg p-3 text-lg font-mono font-bold tracking-wider text-center">
              {referralCode}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Link href={`/e/${slug}`} className="block w-full">
            <Button variant="outline" className="w-full">Return to Event Page</Button>
          </Link>
          <Link href="/" className="block w-full">
            <Button variant="ghost" className="w-full">Back to SwiftVenue</Button>
          </Link>
        </div>
      </div>

      {similarEvents && similarEvents.length > 0 && (
        <div className="max-w-4xl w-full mt-20 animate-in fade-in slide-in-from-bottom-10 delay-300 fill-mode-both">
          <h2 className="text-2xl font-display font-bold mb-8 text-center">Other events you might like</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {similarEvents.map((ev) => (
              <Link key={ev.slug} href={`/e/${ev.slug}`} className="group block bg-card rounded-xl border border-border overflow-hidden hover:border-primary/50 transition-colors shadow-sm hover:shadow-md">
                <div className="aspect-video bg-muted relative overflow-hidden">
                  {ev.hero_image_url ? (
                    <img src={ev.hero_image_url} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-muted to-muted-foreground/20" />
                  )}
                  {ev.theme_color && (
                    <div className="absolute top-0 right-0 w-16 h-16 opacity-30 mix-blend-overlay" style={{ backgroundColor: ev.theme_color }} />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">{ev.title}</h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 shrink-0" /> <span className="line-clamp-1">{ev.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 shrink-0" /> <span className="line-clamp-1">{ev.venue_name}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
