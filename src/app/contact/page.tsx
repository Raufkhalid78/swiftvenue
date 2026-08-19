import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Support — SwiftVenue",
  description: "Need help with your event? Have a billing question? We're here for you.",
  alternates: { canonical: "https://www.swiftvenuehq.com/contact" },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

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
