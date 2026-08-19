import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ClaimClient } from "./claim-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Claim Your Ticket — SwiftVenue",
  description: "Claim and personalize your transferred event ticket.",
};

export default async function ClaimTicketPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const service = createServiceClient();

  const { data: attendee, error } = await service
    .from("attendees")
    .select(`
      id,
      guest_name,
      guest_email,
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
    .single();

  if (error || !attendee) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4 py-12">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
        <ClaimClient attendee={attendee} token={token} />
      </div>
    </div>
  );
}
