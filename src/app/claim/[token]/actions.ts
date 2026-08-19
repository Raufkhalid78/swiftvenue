'use server';

import { createServiceClient } from '@/lib/supabase/server';
import { sendTicketConfirmation } from '@/lib/email';

export async function claimTransferredTicket(
  token: string,
  formData: { name: string; email: string; phone?: string }
) {
  if (!token || !formData.name || !formData.email) {
    return { success: false, error: 'Name and email are required.' };
  }

  const service = createServiceClient();

  // Find attendee by claim token
  const { data: attendee, error: fetchErr } = await service
    .from('attendees')
    .select(`
      id,
      order_id,
      event_id,
      guest_name,
      guest_email,
      guest_phone,
      transferred_at,
      events (
        title,
        date,
        time,
        venue_name,
        venue_address
      ),
      ticket_types (
        name,
        price
      )
    `)
    .eq('claim_token', token)
    .single();

  if (fetchErr || !attendee) {
    return { success: false, error: 'Invalid or expired transfer link.' };
  }

  // If already claimed by this email or claimed previously
  const now = new Date().toISOString();
  const { data: updatedAttendee, error: updateErr } = await service
    .from('attendees')
    .update({
      guest_name: formData.name.trim(),
      guest_email: formData.email.trim().toLowerCase(),
      guest_phone: formData.phone?.trim() || null,
      transferred_at: attendee.transferred_at || now,
    })
    .eq('id', attendee.id)
    .select(`
      id,
      guest_name,
      guest_email,
      guest_phone,
      transferred_at,
      events (
        title,
        date,
        time,
        venue_name,
        venue_address,
        slug,
        hero_image_url
      ),
      ticket_types (
        name,
        price
      )
    `)
    .single();

  if (updateErr) {
    console.error('Failed to claim ticket:', updateErr);
    return { success: false, error: 'Database update failed.' };
  }

  // Send confirmation email to new ticket holder
  const event = Array.isArray(attendee.events) ? attendee.events[0] : attendee.events;
  if (event) {
    try {
      await sendTicketConfirmation({
        to: formData.email.trim().toLowerCase(),
        guestName: formData.name.trim(),
        eventName: event.title,
        eventDate: event.date,
        eventTime: event.time || 'TBD',
        venueName: event.venue_name || 'TBD',
        venueAddress: event.venue_address || '',
        orderId: attendee.order_id || attendee.id,
        attendeeId: attendee.id,
      });
    } catch (e) {
      console.error('Failed to send claimed ticket confirmation email:', e);
    }
  }

  return { 
    success: true, 
    attendeeId: attendee.id,
    attendee: updatedAttendee 
  };
}
