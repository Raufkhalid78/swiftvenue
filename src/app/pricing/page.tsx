import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Footer } from "@/components/footer";
import { CheckCircle2, Sparkles, Building2, Zap } from "lucide-react";

import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: "Pricing - SwiftVenue",
  description: "Simple, transparent pricing for event organizers.",
};

export default async function PricingPage() {
  const supabase = await createClient();
  const { data: plans } = await supabase
    .from('plans')
    .select('*')
    .order('monthly_price', { ascending: true, nullsFirst: true });

  const freePlan = plans?.find(p => p.id === 'free');
  const proPlan = plans?.find(p => p.id === 'pro');
  const enterprisePlan = plans?.find(p => p.id === 'enterprise');

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-border/40 backdrop-blur-md sticky top-0 z-50 bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpg" alt="SwiftVenue Logo" className="w-8 h-8 rounded-lg object-cover shadow-sm border border-border/50" />
            <span className="font-display font-bold text-xl tracking-tight">SwiftVenue</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link href="/#how-it-works" className="hover:text-foreground transition-colors">How it Works</Link>
            <Link href="/#features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="/pricing" className="text-foreground transition-colors font-semibold">Pricing</Link>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h1 className="font-display text-5xl md:text-6xl font-bold tracking-tight mb-6">Simple, transparent pricing.</h1>
            <p className="text-xl text-muted-foreground">
              Whether you're hosting a free community meetup or a massive music festival, we have a plan that fits your scale.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Tier */}
            <div className="p-8 rounded-3xl border border-border bg-card shadow-sm flex flex-col hover:border-primary/50 transition-colors">
              <h3 className="text-2xl font-bold mb-2">Free</h3>
              <p className="text-muted-foreground mb-6">Perfect for small, free community events.</p>
              
              <div className="mb-6">
                <div className="text-4xl font-display font-bold">Rs. 0 <span className="text-lg text-muted-foreground font-normal">/mo</span></div>
              </div>
              
              <div className="bg-muted/50 p-4 rounded-xl border border-border mb-6">
                <p className="text-sm font-semibold mb-1">Ticket Sales Fee</p>
                <p className="text-lg font-bold text-primary">{freePlan?.fee_percent ?? 7}% + Rs {freePlan?.fee_fixed ?? 30} <span className="text-xs font-normal text-muted-foreground">per ticket</span></p>
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" /> 1 concurrent paid event</li>
                <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" /> Basic public page</li>
                <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" /> Safepay Integration</li>
                <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" /> Standard email support</li>
              </ul>
              <Link href="/signup"><Button className="w-full" variant="outline" size="lg">Get Started</Button></Link>
            </div>

            {/* Pro Tier */}
            <div className="p-8 rounded-3xl border-2 border-primary bg-primary/5 shadow-md flex flex-col relative transform md:-translate-y-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold tracking-wide flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> MOST POPULAR
              </div>
              
              <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">Pro</h3>
              <p className="text-muted-foreground mb-6">For serious organizers and event agencies.</p>
              
              <div className="mb-6">
                <div className="text-4xl font-display font-bold">Rs. 3,500 <span className="text-lg text-muted-foreground font-normal">/mo</span></div>
                <p className="text-sm text-emerald-600 font-medium mt-1">Or Rs 35,000 / year (save 2 months)</p>
              </div>
              
              <div className="bg-background p-4 rounded-xl border border-primary/20 mb-6 shadow-sm">
                <p className="text-sm font-semibold mb-1">Ticket Sales Fee</p>
                <p className="text-xl font-bold text-primary">{proPlan?.fee_percent ?? 3}% + Rs {proPlan?.fee_fixed ?? 15} <span className="text-xs font-normal text-muted-foreground">per ticket</span></p>
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" /> <span className="font-medium">Unlimited</span> concurrent paid events</li>
                <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" /> Remove SwiftVenue branding</li>
                <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" /> <span className="font-medium">Unlimited</span> email broadcasts</li>
                <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" /> Premium custom templates</li>
                <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" /> Priority 24/7 support</li>
              </ul>
              <Link href="/signup"><Button className="w-full" size="lg">Start 14-Day Free Trial</Button></Link>
            </div>

            {/* Enterprise Tier */}
            <div className="p-8 rounded-3xl border border-border bg-card shadow-sm flex flex-col hover:border-primary/50 transition-colors">
              <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">Enterprise</h3>
              <p className="text-muted-foreground mb-6">For massive festivals and universities.</p>
              
              <div className="mb-6">
                <div className="text-4xl font-display font-bold">Custom</div>
              </div>
              
              <div className="bg-muted/50 p-4 rounded-xl border border-border mb-6">
                <p className="text-sm font-semibold mb-1">Ticket Sales Fee</p>
                <p className="text-lg font-bold text-primary">As low as {enterprisePlan?.fee_percent ?? 2}% <span className="text-xs font-normal text-muted-foreground">per ticket</span></p>
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" /> Custom ticket fee volume discounts</li>
                <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" /> Dedicated account manager</li>
                <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" /> Custom API integrations</li>
                <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" /> On-site scanning hardware support</li>
                <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" /> Custom domain (e.g., tickets.yourbrand.com)</li>
              </ul>
              <Link href="/contact"><Button className="w-full" variant="outline" size="lg">Contact Sales</Button></Link>
            </div>
          </div>
        </section>

        {/* Feature Comparison Table */}
        <section className="py-24 bg-muted/30 border-y border-border">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-display font-bold mb-4">Compare Features</h2>
              <p className="text-muted-foreground">Find the perfect plan for your event needs.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="py-4 px-6 border-b border-border bg-card font-semibold w-1/4">Feature</th>
                    <th className="py-4 px-6 border-b border-border bg-card font-semibold text-center w-1/4">Free</th>
                    <th className="py-4 px-6 border-b border-border bg-primary/5 font-semibold text-center w-1/4 text-primary">Pro</th>
                    <th className="py-4 px-6 border-b border-border bg-card font-semibold text-center w-1/4">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr className="bg-background hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6 font-medium">Ticket Platform Fee</td>
                    <td className="py-4 px-6 text-center text-muted-foreground">{freePlan?.fee_percent ?? 7}% + Rs {freePlan?.fee_fixed ?? 30}</td>
                    <td className="py-4 px-6 text-center font-bold text-primary bg-primary/5">{proPlan?.fee_percent ?? 3}% + Rs {proPlan?.fee_fixed ?? 15}</td>
                    <td className="py-4 px-6 text-center text-muted-foreground">{enterprisePlan?.fee_percent ?? 2}% flat (custom)</td>
                  </tr>
                  <tr className="bg-background hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6 font-medium">Concurrent Paid Events</td>
                    <td className="py-4 px-6 text-center text-muted-foreground">1 limit</td>
                    <td className="py-4 px-6 text-center font-bold text-primary bg-primary/5">Unlimited</td>
                    <td className="py-4 px-6 text-center text-muted-foreground">Unlimited</td>
                  </tr>
                  <tr className="bg-background hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6 font-medium">Email Broadcasts</td>
                    <td className="py-4 px-6 text-center text-muted-foreground">1 per event</td>
                    <td className="py-4 px-6 text-center font-bold text-primary bg-primary/5">Unlimited</td>
                    <td className="py-4 px-6 text-center text-muted-foreground">Unlimited</td>
                  </tr>
                  <tr className="bg-background hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6 font-medium">Remove Branding</td>
                    <td className="py-4 px-6 text-center text-muted-foreground">-</td>
                    <td className="py-4 px-6 text-center font-bold text-primary bg-primary/5"><CheckCircle2 className="w-5 h-5 mx-auto text-primary" /></td>
                    <td className="py-4 px-6 text-center text-muted-foreground"><CheckCircle2 className="w-5 h-5 mx-auto text-emerald-500" /></td>
                  </tr>
                  <tr className="bg-background hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6 font-medium">Dedicated Manager</td>
                    <td className="py-4 px-6 text-center text-muted-foreground">-</td>
                    <td className="py-4 px-6 text-center font-bold text-primary bg-primary/5">-</td>
                    <td className="py-4 px-6 text-center text-muted-foreground"><CheckCircle2 className="w-5 h-5 mx-auto text-emerald-500" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
