import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendEventReminderEmail, sendEventFeedbackEmail } from '@/lib/email';
import { sendEventReminderWhatsApp } from '@/lib/whatsapp';
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

  // 4. Refresh Exchange Rates
  results.exchangeRates = await refreshExchangeRates(service);

  // 5. Send post-event feedback surveys
  results.feedbackSent = await sendFeedbackEmails(service);

  return NextResponse.json({ ok: true, results });
}

async function refreshExchangeRates(service: SupabaseClient) {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/PKR'); // free, no API key required
    const data = await res.json();
    if (data.result !== 'success') throw new Error('Exchange rate API returned an error');

    const { COUNTRY_TO_CURRENCY } = await import('@/lib/currency-map');
    // Extract unique currencies we care about
    const targetCurrencies = new Set(Object.values(COUNTRY_TO_CURRENCY));

    const updates = Object.entries(data.rates)
      .filter(([code]) => targetCurrencies.has(code))
      .map(([code, rate]) => ({ 
        currency_code: code, 
        rate_from_pkr: rate, 
        updated_at: new Date().toISOString() 
      }));

    for (const update of updates) {
      await service.from('exchange_rates').upsert(update, { onConflict: 'currency_code' });
    }
    return { updated: updates.length };
  } catch (e) {
    console.error('Exchange rate refresh failed, keeping stale rates:', e);
    return { updated: 0, error: true }; // fail gracefully — stale rates are fine for a day, a crash is not
  }
}

async function sendEventReminders(service: SupabaseClient) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const { data: upcomingEvents } = await service
    .from('events')
    .select('id, slug, title, date, time, venue_name, venue_address, attendees(id, guest_name, guest_email, guest_phone)')
    .eq('date', tomorrowStr)
    .eq('status', 'published')
    .is('reminder_sent_at', null);

  for (const event of upcomingEvents ?? []) {
    for (const attendee of event.attendees ?? []) {
      try {
        if (attendee.guest_email) {
          await sendEventReminderEmail({
            to: attendee.guest_email,
            guestName: attendee.guest_name,
            eventName: event.title,
            eventTime: event.time || 'TBD',
            venueName: event.venue_name || 'TBD',
            venueAddress: event.venue_address || '',
          });
        }
        
        if (attendee.guest_phone) {
          await sendEventReminderWhatsApp(
            attendee.guest_phone,
            attendee.guest_name,
            event.title,
            `https://swiftvenuehq.com/e/${event.slug}`
          );
        }
      } catch (e) {
        console.error(`Reminder failed for ${attendee.guest_name}:`, e);
      }
    }
    // Mark as sent to prevent duplicate sending (idempotency)
    await service.from('events').update({ reminder_sent_at: new Date().toISOString() }).eq('id', event.id);
  }
  return upcomingEvents?.length ?? 0;
}

async function sendFeedbackEmails(service: SupabaseClient) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const { data: pastEvents } = await service
    .from('events')
    .select('id, slug, title, date, attendees(guest_name, guest_email)')
    .eq('date', yesterdayStr)
    .eq('status', 'published')
    .is('feedback_sent_at', null);

  for (const event of pastEvents ?? []) {
    for (const attendee of event.attendees ?? []) {
      if (!attendee.guest_email) continue;
      
      try {
        await sendEventFeedbackEmail({
          to: attendee.guest_email,
          guestName: attendee.guest_name,
          eventName: event.title,
          feedbackUrl: `https://swiftvenuehq.com/e/${event.slug}/feedback`,
        });
      } catch (e) {
        console.error(`Feedback email failed for ${attendee.guest_email}:`, e);
      }
    }
    // Mark as sent to prevent duplicate sending
    await service.from('events').update({ feedback_sent_at: new Date().toISOString() }).eq('id', event.id);
  }
  return pastEvents?.length ?? 0;
}