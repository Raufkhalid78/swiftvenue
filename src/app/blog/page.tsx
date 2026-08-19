export const revalidate = 300;
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — SwiftVenue",
  description: "Insights, updates, and event planning tips from the SwiftVenue team.",
  alternates: { canonical: "https://www.swiftvenuehq.com/blog" },
};

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

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
