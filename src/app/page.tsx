import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Footer } from "@/components/footer";
import { CalendarDays, Users, CreditCard, Sparkles, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-border/40 backdrop-blur-md sticky top-0 z-50 bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpg" alt="SwiftVenue Logo" className="w-8 h-8 rounded-lg object-cover shadow-sm border border-border/50" />
            <span className="font-display font-bold text-xl tracking-tight">SwiftVenue</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link href="#how-it-works" className="hover:text-foreground transition-colors">How it Works</Link>
            <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {user ? (
              <Link href={user.user_metadata?.is_admin ? "/admin" : "/dashboard"}>
                <Button>Go to Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden sm:block">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/signup">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 sm:pt-32 sm:pb-24">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" /> Introducing SwiftVenue 2.0
            </div>
            <h1 className="font-display text-5xl sm:text-7xl font-bold tracking-tight mb-8">
              Manage your events with <span className="text-primary">absolute clarity.</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto">
              From corporate offsites to university festivals, SwiftVenue is the intuitive platform that brings your event planning, ticketing, and guest management into one unified workflow.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="w-full h-12 px-8 text-base shadow-sm">Start Planning for Free</Button>
              </Link>
              <Link href="#features" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full h-12 px-8 text-base bg-transparent">Explore Features</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Social Proof / Trust Bar */}
        <section className="border-y border-border bg-muted/20 py-10 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-sm font-medium text-muted-foreground mb-6 uppercase tracking-widest">Trusted by innovative teams worldwide</p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all">
              <div className="font-display font-bold text-2xl">Acme Corp</div>
              <div className="font-display font-bold text-2xl">Globex</div>
              <div className="font-display font-bold text-2xl">Soylent</div>
              <div className="font-display font-bold text-2xl">Initech</div>
              <div className="font-display font-bold text-2xl">Umbrella</div>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section id="how-it-works" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">How SwiftVenue Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Three simple steps to launch your next big event.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="relative p-8 rounded-3xl border border-border bg-card shadow-sm text-center">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold">1</div>
              <h3 className="text-xl font-semibold mb-3">Create</h3>
              <p className="text-muted-foreground">Use our intuitive multi-step wizard to set up your event details, schedule, and branding in under 2 minutes.</p>
            </div>
            <div className="relative p-8 rounded-3xl border border-border bg-card shadow-sm text-center">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold">2</div>
              <h3 className="text-xl font-semibold mb-3">Share</h3>
              <p className="text-muted-foreground">Publish your beautiful public event page and share the URL. Attendees can instantly view the agenda and RSVP.</p>
            </div>
            <div className="relative p-8 rounded-3xl border border-border bg-card shadow-sm text-center">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold">3</div>
              <h3 className="text-xl font-semibold mb-3">Manage</h3>
              <p className="text-muted-foreground">Track ticket sales, manage your guest list, and scan QR codes at the door using our powerful organizer dashboard.</p>
            </div>
          </div>
        </section>

        {/* Deep Dive Features */}
        <section id="features" className="py-24 bg-muted/30 border-y border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-32">
            
            <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-24">
              <div className="flex-1 space-y-6">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center"><CalendarDays className="w-6 h-6" /></div>
                <h2 className="text-3xl md:text-4xl font-display font-bold">Powerful Agenda Builder</h2>
                <p className="text-lg text-muted-foreground">Keep your attendees informed with a crystal clear schedule. Our drag-and-drop agenda builder lets you add sessions, speakers, and exact timings that instantly sync to your public page.</p>
                <ul className="space-y-3 pt-4">
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary" /> Real-time public page syncing</li>
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary" /> Attach speaker profiles & bios</li>
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary" /> Multi-day schedule support</li>
                </ul>
              </div>
              <div className="flex-1 w-full aspect-square md:aspect-[4/3] bg-background rounded-3xl border border-border shadow-lg overflow-hidden flex items-center justify-center p-8">
                {/* Abstract visualization of an agenda */}
                <div className="w-full space-y-4">
                  <div className="w-full h-16 bg-muted rounded-lg flex items-center px-4 gap-4"><div className="w-16 h-6 rounded bg-primary/20"></div><div className="h-4 flex-1 rounded bg-border"></div></div>
                  <div className="w-full h-16 bg-muted rounded-lg flex items-center px-4 gap-4"><div className="w-16 h-6 rounded bg-primary/20"></div><div className="h-4 flex-1 rounded bg-border"></div></div>
                  <div className="w-full h-16 bg-muted rounded-lg flex items-center px-4 gap-4"><div className="w-16 h-6 rounded bg-primary/20"></div><div className="h-4 flex-1 rounded bg-border"></div></div>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row-reverse items-center gap-12 lg:gap-24">
              <div className="flex-1 space-y-6">
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center"><CreditCard className="w-6 h-6" /></div>
                <h2 className="text-3xl md:text-4xl font-display font-bold">Integrated Safepay Ticketing</h2>
                <p className="text-lg text-muted-foreground">Monetize your events effortlessly. With our native Safepay integration, you can sell tickets in PKR and have the funds deposited directly into your bank account securely.</p>
                <ul className="space-y-3 pt-4">
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Credit Card & Debit Card processing</li>
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Automated digital ticket dispatch</li>
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Secure checkout redirection</li>
                </ul>
              </div>
              <div className="flex-1 w-full aspect-square md:aspect-[4/3] bg-background rounded-3xl border border-border shadow-lg overflow-hidden flex items-center justify-center p-8">
                {/* Abstract visualization of a checkout */}
                <div className="w-full max-w-sm bg-card border border-border rounded-xl shadow-sm p-6 space-y-4">
                  <div className="h-6 w-32 bg-border rounded mb-6"></div>
                  <div className="h-10 w-full bg-muted rounded"></div>
                  <div className="h-10 w-full bg-muted rounded"></div>
                  <div className="h-12 w-full bg-emerald-500/20 rounded mt-4"></div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Testimonials */}
        <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-border">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Loved by Organizers</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">See what event professionals are saying about SwiftVenue.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-card border border-border shadow-sm flex flex-col">
              <div className="flex gap-1 mb-4 text-yellow-400">
                {Array(5).fill("").map((_, i) => <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}
              </div>
              <p className="text-muted-foreground mb-6 flex-1 italic">"SwiftVenue completely transformed how we handle our annual university tech fest. The ticketing was seamless and the templates made us look incredibly professional."</p>
              <div>
                <p className="font-semibold text-foreground">Sarah Jenkins</p>
                <p className="text-sm text-muted-foreground">Event Director, TechFest</p>
              </div>
            </div>
            <div className="p-8 rounded-3xl bg-card border border-border shadow-sm flex flex-col">
              <div className="flex gap-1 mb-4 text-yellow-400">
                {Array(5).fill("").map((_, i) => <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}
              </div>
              <p className="text-muted-foreground mb-6 flex-1 italic">"The Safepay integration is flawless. We collected PKR payments without any of the usual hassle. Best platform for Pakistani organizers."</p>
              <div>
                <p className="font-semibold text-foreground">Ali Raza</p>
                <p className="text-sm text-muted-foreground">Corporate Events Lead</p>
              </div>
            </div>
            <div className="p-8 rounded-3xl bg-card border border-border shadow-sm flex flex-col">
              <div className="flex gap-1 mb-4 text-yellow-400">
                {Array(5).fill("").map((_, i) => <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}
              </div>
              <p className="text-muted-foreground mb-6 flex-1 italic">"I created a beautiful, branded event page in exactly 2 minutes. The Classic template fits our executive offsites perfectly."</p>
              <div>
                <p className="font-semibold text-foreground">Aisha Khan</p>
                <p className="text-sm text-muted-foreground">Startup Founder</p>
              </div>
            </div>
          </div>
        </section>



        {/* FAQ */}
        <section className="py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground">Everything you need to know about SwiftVenue.</p>
          </div>
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
              <h3 className="text-lg font-semibold mb-2">How does the Safepay integration work?</h3>
              <p className="text-muted-foreground">We partner directly with Safepay for secure payment processing. Funds from your ticket sales are collected in PKR and deposited directly into your linked local bank account after a standard holding period.</p>
            </div>
            <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
              <h3 className="text-lg font-semibold mb-2">Can I change my event template later?</h3>
              <p className="text-muted-foreground">Yes! You can switch between Modern, Minimalist, and Classic templates at any time from your event dashboard. The changes reflect instantly on your public page.</p>
            </div>
            <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
              <h3 className="text-lg font-semibold mb-2">Is there a limit on free events?</h3>
              <p className="text-muted-foreground">No, you can host as many free events as you want on our Free tier, up to 100 RSVPs per event. We only charge a platform fee when you sell paid tickets.</p>
            </div>
            <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
              <h3 className="text-lg font-semibold mb-2">Do attendees need an account to buy tickets?</h3>
              <p className="text-muted-foreground">No, your guests can purchase tickets or RSVP as a guest. They will receive their digital ticket and QR code directly via email.</p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 bg-primary text-primary-foreground text-center">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">Ready to host your best event yet?</h2>
            <p className="text-primary-foreground/80 text-xl mb-10 max-w-2xl mx-auto">
              Join thousands of organizers who use SwiftVenue to plan, promote, and execute flawless events.
            </p>
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="h-14 px-10 text-lg rounded-full">
                Create Your First Event
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
