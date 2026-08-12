"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendWaitlistOffer } from "@/lib/email";

export async function forceWaitlistOffer(eventId: string, waitlistId: string) {
  const service = createServiceClient();
  
  const { data: entry, error } = await service.from('waitlists')
    .select('*, ticket_types(name), events(title, date, time, slug)')
    .eq('id', waitlistId)
    .single();
    
  if (error) throw new Error(error.message);
  if (entry.status !== 'waiting') throw new Error('User is not waiting');

  const expiry = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
  
  const { error: updateErr } = await service.from('waitlists')
    .update({ status: 'notified', offer_expires_at: expiry.toISOString() })
    .eq('id', waitlistId);
    
  if (updateErr) throw new Error(updateErr.message);
  
  await sendWaitlistOffer({
     to: entry.user_email,
     guestName: entry.user_name,
     eventName: entry.events.title,
     eventDate: entry.events.date,
     eventTime: entry.events.time,
     ticketName: entry.ticket_types.name,
     expiresAt: expiry.toISOString(),
     checkoutUrl: `https://swiftvenuehq.com/e/${entry.events.slug}?waitlist_token=${entry.id}`
  });

  revalidatePath(`/dashboard/events/${eventId}/waitlist`);
}

export async function removeWaitlistEntry(eventId: string, waitlistId: string) {
  const service = createServiceClient();
  const { error } = await service.from('waitlists').delete().eq('id', waitlistId);
  if (error) throw new Error(error.message);
  
  revalidatePath(`/dashboard/events/${eventId}/waitlist`);
}
