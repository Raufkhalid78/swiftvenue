import Link from "next/link";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us — SwiftVenue",
  description: "Learn more about SwiftVenue's mission to simplify event management for professionals, creators, and communities worldwide.",
  alternates: { canonical: "https://swiftvenuehq.com/about" },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="border-b border-border/40 backdrop-blur-md sticky top-0 z-50 bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
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

      <main className="flex-1 max-w-3xl mx-auto px-4 py-24 text-center">
        <h1 className="font-display text-5xl font-bold mb-6">About SwiftVenue</h1>
        <p className="text-xl text-muted-foreground mb-12 leading-relaxed">
          We are on a mission to simplify event management for professionals, creators, and communities worldwide. By blending beautiful design with powerful tools, we help you focus on what really matters: hosting unforgettable events.
        </p>
        <div className="p-8 bg-muted/30 rounded-2xl border border-border">
          <h2 className="text-2xl font-semibold mb-4">Our Story</h2>
          <p className="text-muted-foreground">
            SwiftVenue started as a simple idea to make RSVP tracking easier. Today, it has evolved into a fully-fledged platform handling everything from agenda building to secure payment processing.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
