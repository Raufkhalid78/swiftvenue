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

  // 1b. Delete orders that have been pending, cancelled, or expired for more than 24 hours
  const { data: staleOrdersCount, error: cleanupErr } = await service.rpc('cleanup_stale_orders');
  
  if (cleanupErr) {
    results.deleteOrdersError = cleanupErr.message;
  } else {
    results.deletedStaleOrdersCount = staleOrdersCount;
  }

  // 2. Expire notified waitlist offers past their window, cascade to next person
  const { data: expiredWaitlist, error: waitlistErr } = await service
    .from('waitlists')
    .select('id, ticket_type_id')
    .eq('status', 'notified')
    .lt('offer_expires_at', new Date().toISOString());

  if (waitlistErr) {
    results.waitlistError = waitlistErr.message;
  } else if (expiredWaitlist && expiredWaitlist.length > 0) {
    const expiredIds = expiredWaitlist.map(e => e.id);
    const uniqueTicketTypeIds = Array.from(new Set(expiredWaitlist.map(e => e.ticket_type_id)));

    await Promise.all([
      service.from('waitlists').update({ status: 'expired' }).in('id', expiredIds),
      ...uniqueTicketTypeIds.map(ticketTypeId => 
        service.rpc('notify_next_waitlist_entry', { p_ticket_type_id: ticketTypeId })
      )
    ]);
    results.waitlistExpired = expiredWaitlist.length;
  } else {
    results.waitlistExpired = 0;
  }

  // 3. Send event reminders for tomorrow's events
  results.remindersSent = await sendEventReminders(service);

  // 4. Refresh Exchange Rates
  results.exchangeRates = await refreshExchangeRates(service);

  // 5. Send post-event feedback surveys
  results.feedbackSent = await sendFeedbackEmails(service);

  // 6. Storage Cleanup: Orphaned images
  results.storageCleanup = await cleanupOrphanedImages(service);

  // 7. Event Lifecycle: Auto-archive events concluded over 6 months ago (180 days)
  const { archiveConcludedEvents } = await import('@/lib/event-archival');
  results.archivedEvents = await archiveConcludedEvents(service);

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

    if (updates.length > 0) {
      await service.from('exchange_rates').upsert(updates, { onConflict: 'currency_code' });
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
    const attendees = event.attendees ?? [];
    await Promise.allSettled(
      attendees.map(async (attendee: any) => {
        const promises: Promise<any>[] = [];
        if (attendee.guest_email) {
          promises.push(
            sendEventReminderEmail({
              to: attendee.guest_email,
              guestName: attendee.guest_name,
              eventName: event.title,
              eventTime: event.time || 'TBD',
              venueName: event.venue_name || 'TBD',
              venueAddress: event.venue_address || '',
            })
          );
        }
        
        if (attendee.guest_phone) {
          promises.push(
            sendEventReminderWhatsApp(
              attendee.guest_phone,
              attendee.guest_name,
              event.title,
              `https://swiftvenuehq.com/e/${event.slug}`
            )
          );
        }
        return Promise.allSettled(promises);
      })
    );
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
    const attendees = (event.attendees ?? []).filter((a: any) => !!a.guest_email);
    await Promise.allSettled(
      attendees.map(async (attendee: any) => {
        return sendEventFeedbackEmail({
          to: attendee.guest_email,
          guestName: attendee.guest_name,
          eventName: event.title,
          feedbackUrl: `https://swiftvenuehq.com/e/${event.slug}/feedback`,
        });
      })
    );
    // Mark as sent to prevent duplicate sending
    await service.from('events').update({ feedback_sent_at: new Date().toISOString() }).eq('id', event.id);
  }
  return pastEvents?.length ?? 0;
}

async function cleanupOrphanedImages(service: SupabaseClient) {
  try {
    const [eventsRes, galleryRes, speakersRes, sponsorsRes] = await Promise.all([
      service.from('events').select('hero_image_url').not('hero_image_url', 'is', null),
      service.from('event_gallery').select('image_url').not('image_url', 'is', null),
      service.from('event_speakers').select('photo_url').not('photo_url', 'is', null),
      service.from('event_sponsors').select('logo_url').not('logo_url', 'is', null),
    ]);

    const referencedUrls = new Set<string>();
    eventsRes.data?.forEach(r => referencedUrls.add(r.hero_image_url));
    galleryRes.data?.forEach(r => referencedUrls.add(r.image_url));
    speakersRes.data?.forEach(r => referencedUrls.add(r.photo_url));
    sponsorsRes.data?.forEach(r => referencedUrls.add(r.logo_url));

    const { data: folders } = await service.storage.from('event-images').list();
    let orphanedPaths: string[] = [];
    
    for (const folder of folders || []) {
       if (!folder.id) continue; // Ignore files at root, only process folders (user_id)
       const { data: files } = await service.storage.from('event-images').list(folder.name);
       for (const file of files || []) {
          if (file.name === '.emptyFolderPlaceholder') continue;
          
          const { data: { publicUrl } } = service.storage.from('event-images').getPublicUrl(`${folder.name}/${file.name}`);
          if (!referencedUrls.has(publicUrl)) {
             orphanedPaths.push(`${folder.name}/${file.name}`);
          }
       }
    }
    
    if (orphanedPaths.length > 0) {
      await service.storage.from('event-images').remove(orphanedPaths);
    }
    return { deleted: orphanedPaths.length };
  } catch (e) {
    console.error('Storage cleanup failed:', e);
    return { deleted: 0, error: true };
  }
}