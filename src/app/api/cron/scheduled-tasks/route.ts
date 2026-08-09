import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendEventReminderEmail } from '@/lib/email';
import { SupabaseClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  // Verify this is actually called by Vercel Cron, not a public hit
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const service = createServiceClient();
  const results: Record<string, unknown> = {};

  // 1. Expire stale pending orders, release held inventory
  const { data: expiredOrders, error: expireErr } = await service.rpc('expire_stale_orders');
  results.expiredOrders = expireErr ? { error: expireErr.message } : expiredOrders;

  // 2. Expire notified waitlist offers past their window, cascade to next person
  const { data: expiredWaitlist, error: waitlistErr } = await service
    .from('waitlists')
    .select('id, ticket_type_id')
    .eq('status', 'notified')
    .lt('offer_expires_at', new Date().toISOString());

  if (waitlistErr) {
    results.waitlistError = waitlistErr.message;
  } else {
    for (const entry of expiredWaitlist ?? []) {
      await service.from('waitlists').update({ status: 'expired' }).eq('id', entry.id);
      await service.rpc('notify_next_waitlist_entry', { p_ticket_type_id: entry.ticket_type_id });
    }
    results.waitlistExpired = expiredWaitlist?.length ?? 0;
  }

  // 3. Send event reminders for tomorrow's events
  results.remindersSent = await sendEventReminders(service);

  return NextResponse.json({ ok: true, results });
}

async function sendEventReminders(service: SupabaseClient) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const { data: upcomingEvents } = await service
    .from('events')
    .select('id, title, date, time, venue_name, venue_address, attendees(guest_name, guest_email)')
    .eq('date', tomorrowStr)
    .eq('status', 'published')
    .is('reminder_sent_at', null);

  for (const event of upcomingEvents ?? []) {
    for (const attendee of event.attendees ?? []) {
      try {
        await sendEventReminderEmail({
          to: attendee.guest_email,
          guestName: attendee.guest_name,
          eventName: event.title,
          eventTime: event.time || 'TBD',
          venueName: event.venue_name || 'TBD',
          venueAddress: event.venue_address || '',
        });
      } catch (e) {
        console.error(`Reminder email failed for ${attendee.guest_email}:`, e);
      }
    }
    // Mark as sent to prevent duplicate sending (idempotency)
    await service.from('events').update({ reminder_sent_at: new Date().toISOString() }).eq('id', event.id);
  }
  return upcomingEvents?.length ?? 0;
}