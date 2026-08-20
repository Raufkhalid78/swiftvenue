import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Calendar, MapPin, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

import { SavedEventsClient } from "./saved-events-client";

export default async function SavedEventsPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth/signin");
  }

  const { data: savedEvents, error } = await supabase
    .from('saved_events')
    .select(`
      id,
      event_id,
      events (
        id,
        title,
        slug,
        date,
        time,
        venue_name,
        hero_image_url
      )
    `)
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching saved events:", error);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-display tracking-tight">Saved Events</h1>
        <p className="text-muted-foreground mt-2">Events you have bookmarked for later.</p>
      </div>

      <SavedEventsClient initialEvents={(savedEvents as any) || []} />
    </div>
  );
}
