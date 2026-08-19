import { createServiceClient } from "@/lib/supabase/server";
import { ClaimClient } from "./claim-client";
import { Metadata } from "next";
import Link from "next/link";
import { Ticket, AlertCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Claim Your Ticket — SwiftVenue",
  description: "Claim and view your transferred digital event pass.",
};

export default async function ClaimTicketPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const service = createServiceClient();

  const { data: attendee } = await service
    .from("attendees")
    .select(`
      id,
      guest_name,
      guest_email,
      guest_phone,
      status,
      transferred_at,
      original_purchaser_email,
      events (
        id,
        title,
        date,
        time,
        venue_name,
        venue_address,
        hero_image_url,
        slug
      ),
      ticket_types (
        name,
        price
      )
    `)
    .eq("claim_token", token)
    .maybeSingle();

  if (!attendee) {
    return (
      <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4 py-12">
        <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl p-8 text-center space-y-6 animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold font-display text-foreground">Ticket Link Not Found</h1>
            <p className="text-sm text-muted-foreground">
              This ticket transfer link is invalid, expired, or has already been transferred to a newer recipient.
            </p>
          </div>

          <div className="p-4 bg-muted/30 border border-border/80 rounded-xl text-xs text-muted-foreground text-left space-y-1">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <Ticket className="w-4 h-4 text-primary" /> Looking for your tickets?
            </div>
            <p>If you already claimed this ticket with your email, check your inbox for the digital QR pass or login to your dashboard.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button asChild variant="outline" className="flex-1">
              <Link href="/">
                <Home className="w-4 h-4 mr-2" /> Home
              </Link>
            </Button>
            <Button asChild className="flex-1">
              <Link href="/dashboard/tickets">
                My Tickets
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4 py-12">
      <div className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden">
        <ClaimClient attendee={attendee} token={token} />
      </div>
    </div>
  );
}
