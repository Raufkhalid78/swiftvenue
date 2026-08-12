import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { checkEventAccess } from '@/lib/team';
import { checkGuestLimit } from '@/lib/plans';
import { buildAttendeeRow } from '@/lib/guest-import';
import { sendTicketConfirmation } from '@/lib/email';
import { sendTicketViaWhatsApp } from '@/lib/whatsapp';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const resolvedParams = await params;
  
  const { guests } = await request.json();
  if (!Array.isArray(guests) || guests.length === 0) {
    return NextResponse.json({ error: 'No guests provided' }, { status: 400 });
  }
  if (guests.length > 1000) {
    return NextResponse.json({ error: 'Maximum 1000 guests per import — split into multiple files' }, { status: 400 });
  }

  const service = createServiceClient();

  const hasAccess = await checkEventAccess(service, resolvedParams.id, user.id, ['owner', 'coorganizer']);
  if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data: event } = await service.from('events').select('user_id, profiles(plan)').eq('id', resolvedParams.id).single();
  const organizerPlan = (event as any)?.profiles?.plan || 'free';

  const limitResponse = await checkGuestLimit(service, resolvedParams.id, organizerPlan, guests.length);
  if (limitResponse) return limitResponse;

  const rows = guests.map((g: { name: string; email: string }) => buildAttendeeRow(g, resolvedParams.id));

  const { data: insertedAttendees, error, count } = await service.from('attendees').insert(rows).select();
  if (error) {
    console.error('Bulk import failed:', error);
    return NextResponse.json({ error: 'Import failed, please try again' }, { status: 500 });
  }

  // Fetch event details for ticket delivery
  const { data: eventDetails } = await service
    .from('events')
    .select('title, date, time, venue_name, venue_address, slug')
    .eq('id', resolvedParams.id)
    .single();

  if (eventDetails && insertedAttendees && insertedAttendees.length > 0) {
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');

    // Process delivery concurrently in chunks to respect edge function timeouts
    const chunkSize = 50;
    for (let i = 0; i < insertedAttendees.length; i += chunkSize) {
      const chunk = insertedAttendees.slice(i, i + chunkSize);
      
      await Promise.allSettled(chunk.map(async (attendee) => {
        const promises = [];
        
        if (attendee.guest_email) {
          promises.push(
            sendTicketConfirmation({
              to: attendee.guest_email,
              guestName: attendee.guest_name,
              eventName: eventDetails.title,
              eventDate: eventDetails.date,
              eventTime: eventDetails.time || 'TBD',
              venueName: eventDetails.venue_name || 'TBD',
              venueAddress: eventDetails.venue_address || '',
              orderId: 'Bulk Import', // Fallback since there is no order
              attendeeId: attendee.id,
            }).catch(e => console.error(`Email failed for ${attendee.guest_email}:`, e))
          );
        }

        if (attendee.guest_phone) {
          promises.push(
            sendTicketViaWhatsApp(
              attendee.guest_phone,
              attendee.guest_name,
              eventDetails.title,
              `${protocol}://${host}/e/${eventDetails.slug}` // Standard event link
            ).catch(e => console.error(`WhatsApp failed for ${attendee.guest_phone}:`, e))
          );
        }

        await Promise.all(promises);
      }));
    }
  }

  return NextResponse.json({ imported: count ?? rows.length });
}
