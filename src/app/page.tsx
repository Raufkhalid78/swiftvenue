import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Footer } from "@/components/footer";
import { CalendarDays, Users, CreditCard, Sparkles, CheckCircle2, QrCode } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: plans } = await supabase
    .from('plans')
    .select('*')
    .order('monthly_price', { ascending: true, nullsFirst: true });

  const freePlan = plans?.find(p => p.id === 'free');
  const proPlan = plans?.find(p => p.id === 'pro');
  const enterprisePlan = plans?.find(p => p.id === 'enterprise');

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-border/40 backdrop-blur-md sticky top-0 z-50 bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            { }
            <img src="/logo.jpg" alt="SwiftVenue Logo" className="w-8 h-8 rounded-lg object-cover shadow-sm border border-border/50" />
            <span className="font-display font-bold text-xl tracking-tight">SwiftVenue</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link href="#how-it-works" className="hover:text-foreground transition-colors">How it Works</Link>
            <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
            <Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link>
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

        {/* Positioning Bar */}
        <section className="border-y border-border bg-muted/20 py-10 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
              Pakistan's modern event & ticketing platform
            </p>
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
            
            {/* Feature 1: Agenda */}
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
              <div className="flex-1 w-full aspect-square md:aspect-[4/3] bg-muted/50 rounded-3xl border border-border overflow-hidden relative shadow-lg">
                <Image 
                  src="/mockups/agenda_builder_mockup_1786220553907.jpg"
                  alt="SwiftVenue drag-and-drop agenda builder interface"
                  fill
                  className="object-cover object-center"
                />
              </div>
            </div>

            {/* Feature 2: Safepay Ticketing */}
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
              <div className="flex-1 w-full aspect-square md:aspect-[4/3] bg-muted/50 rounded-3xl border border-border overflow-hidden relative shadow-lg">
                <Image 
                  src="/mockups/safepay_ticketing_mockup_1786220564427.jpg"
                  alt="SwiftVenue ticket checkout flow with Safepay"
                  fill
                  className="object-cover object-center"
                />
              </div>
            </div>

            {/* Feature 3: Waitlist */}
            <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-24">
              <div className="flex-1 space-y-6">
                <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center"><Users className="w-6 h-6" /></div>
                <h2 className="text-3xl md:text-4xl font-display font-bold">Never Lose a Sale to a Sellout</h2>
                <p className="text-lg text-muted-foreground">When tickets sell out, guests join a waitlist automatically. The moment a ticket frees up — from a refund or a released hold — the next person in line gets a time-limited offer to buy, recovering lost demand automatically.</p>
                <ul className="space-y-3 pt-4">
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-blue-500" /> Automatic waitlist-to-purchase conversion</li>
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-blue-500" /> Time-limited purchase windows</li>
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-blue-500" /> Live ticket inventory management</li>
                </ul>
              </div>
              <div className="flex-1 w-full aspect-square md:aspect-[4/3] bg-muted/50 rounded-3xl border border-border overflow-hidden relative shadow-lg">
                <Image 
                  src="/mockups/waitlist_management_mockup_1786220574365.jpg"
                  alt="SwiftVenue waitlist and capacity management interface"
                  fill
                  className="object-cover object-center"
                />
              </div>
            </div>

            {/* Feature 4: Check-in */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-12 lg:gap-24">
              <div className="flex-1 space-y-6">
                <div className="w-12 h-12 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center"><QrCode className="w-6 h-6" /></div>
                <h2 className="text-3xl md:text-4xl font-display font-bold">Flawless Guest Check-In</h2>
                <p className="text-lg text-muted-foreground">Keep the lines moving fast at the door. Scan digital QR tickets with any device, manually check off VIPs from the guest list, and track live attendance stats from your dashboard.</p>
                <ul className="space-y-3 pt-4">
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-purple-500" /> Lightning-fast QR code scanning</li>
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-purple-500" /> Searchable digital guest list</li>
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-purple-500" /> Real-time attendance tracking</li>
                </ul>
              </div>
              <div className="flex-1 w-full aspect-square md:aspect-[4/3] bg-muted/50 rounded-3xl border border-border overflow-hidden relative shadow-lg">
                <Image 
                  src="/mockups/checkin_management_mockup_1786220585615.jpg"
                  alt="SwiftVenue check-in and QR scanner interface"
                  fill
                  className="object-cover object-center"
                />
              </div>
            </div>

          </div>
        </section>

        {/* Pricing Preview */}
        <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-border">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Start for free, upgrade when you need more power.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="p-8 rounded-3xl bg-card border border-border shadow-sm flex flex-col">
              <h3 className="text-xl font-semibold mb-2">Free</h3>
              <p className="text-3xl font-bold mb-1">Rs 0 <span className="text-lg font-normal text-muted-foreground">/mo</span></p>
              <p className="text-muted-foreground mb-6">Perfect for small community events.</p>
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary" /> {freePlan?.fee_percent ?? 7}% + Rs {freePlan?.fee_fixed ?? 30} per paid ticket</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary" /> Unlimited free events</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary" /> Safepay ticketing</li>
              </ul>
            </div>
            <div className="p-8 rounded-3xl bg-primary text-primary-foreground shadow-md flex flex-col relative scale-105">
              <div className="absolute top-0 right-8 transform -translate-y-1/2">
                <span className="bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">Most Popular</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Pro</h3>
              <p className="text-3xl font-bold mb-1">
                Rs {proPlan?.monthly_price?.toLocaleString() ?? '3,500'} <span className="text-lg font-normal text-primary-foreground/70">/mo</span>
              </p>
              <p className="text-primary-foreground/80 mb-6">For professional event organizers.</p>
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary-foreground" /> {proPlan?.fee_percent ?? 3}% + Rs {proPlan?.fee_fixed ?? 15} per paid ticket</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary-foreground" /> Unlimited concurrent paid events</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary-foreground" /> Branding removed, unlimited broadcasts</li>
              </ul>
            </div>
            <div className="p-8 rounded-3xl bg-card border border-border shadow-sm flex flex-col">
              <h3 className="text-xl font-semibold mb-2">Enterprise</h3>
              <p className="text-3xl font-bold mb-1">Custom</p>
              <p className="text-muted-foreground mb-6">For agencies and large festivals.</p>
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary" /> As low as {enterprisePlan?.fee_percent ?? 2}% per ticket, volume-negotiated</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary" /> Dedicated support</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary" /> Contact sales for details</li>
              </ul>
            </div>
          </div>
          <div className="text-center mt-12">
            <Link href="/pricing"><Button variant="outline" size="lg">See full pricing details</Button></Link>
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
              <p className="text-muted-foreground">SwiftVenue currently supports PKR payments via Safepay, built specifically for Pakistani organizers and their guests. Funds from your ticket sales are collected in PKR and deposited directly into your linked local bank account after a standard holding period. Multi-currency support is on our roadmap as we expand.</p>
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
