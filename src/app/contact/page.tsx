import Link from "next/link";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="border-b border-border/40 backdrop-blur-md sticky top-0 z-50 bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.jpg" alt="SwiftVenue Logo" className="w-8 h-8 rounded-lg object-cover shadow-sm border border-border/50" />
            <span className="font-display font-bold text-xl tracking-tight">SwiftVenue</span>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/dashboard">
              <Button variant="outline" size="sm">Dashboard</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-2xl mx-auto px-4 py-24 text-center">
        <h1 className="font-display text-5xl font-bold mb-6">Contact Support</h1>
        <p className="text-xl text-muted-foreground mb-12">
          Need help with your event? Have a billing question? We're here for you.
        </p>
        <div className="p-8 bg-card rounded-2xl border border-border shadow-sm text-left space-y-6">
          <div>
            <label className="text-sm font-medium">Your Email</label>
            <input type="email" className="w-full mt-2 p-3 rounded-md border border-input bg-background" placeholder="hello@example.com" />
          </div>
          <div>
            <label className="text-sm font-medium">Message</label>
            <textarea className="w-full mt-2 p-3 rounded-md border border-input bg-background h-32" placeholder="How can we help?"></textarea>
          </div>
          <Button className="w-full">Send Message</Button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
