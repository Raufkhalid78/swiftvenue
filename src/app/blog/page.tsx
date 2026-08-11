import Link from "next/link";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — SwiftVenue",
  description: "Insights, updates, and event planning tips from the SwiftVenue team.",
  alternates: { canonical: "https://www.swiftvenuehq.com/blog" },
};

export default function BlogPage() {
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

      <main className="flex-1 max-w-4xl mx-auto px-4 py-24 text-center">
        <h1 className="font-display text-5xl font-bold mb-6">SwiftVenue Blog</h1>
        <p className="text-xl text-muted-foreground mb-12">
          Insights, updates, and event planning tips.
        </p>
        
        <div className="p-12 border border-dashed border-border rounded-2xl bg-muted/20">
          <h2 className="text-2xl font-semibold mb-2">Coming Soon</h2>
          <p className="text-muted-foreground">We are currently writing our first batch of articles. Check back soon!</p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
