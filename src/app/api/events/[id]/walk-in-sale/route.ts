import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { checkEventAccess } from '@/lib/team';
import { checkGuestLimit } from '@/lib/plans';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const service = createServiceClient();
    const hasAccess = await checkEventAccess(service, eventId, user.id, ['owner', 'coorganizer', 'checkin_staff']);
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { ticketTypeId, guestName, guestEmail, guestPhone, isComplimentary } = await request.json();

    const { data: ticketType } = await service.from('ticket_types').select('*').eq('id', ticketTypeId).single();
    if (!ticketType) return NextResponse.json({ error: 'Ticket type not found' }, { status: 404 });

    // Reuse the exact same atomic reservation used by online checkout —
    // a walk-in sale competes for the same limited inventory as everyone else
    const { data: reserved } = await service.rpc('reserve_ticket', { p_ticket_type_id: ticketTypeId, p_qty: 1 });
    if (!reserved) {
      return NextResponse.json({ error: 'This ticket type is sold out' }, { status: 409 });
    }

    const { data: event } = await service.from('events').select('user_id, profiles(plan)').eq('id', eventId).single();
    const organizerPlan = (event as any)?.profiles?.plan || 'free';
    const limitResponse = await checkGuestLimit(service, eventId, organizerPlan, 1);
    if (limitResponse) {
      await service.rpc('reserve_ticket', { p_ticket_type_id: ticketTypeId, p_qty: -1 }); // release on limit failure
      return limitResponse;
    }

    const amount = isComplimentary ? 0 : Number(ticketType.price);
    const validEmail = !!guestEmail;

    const { data: order, error: orderErr } = await service.from('orders').insert({
      event_id: eventId,
      ticket_type_id: ticketTypeId,
      guest_name: guestName,
      guest_email: guestEmail || `walkin-${Date.now()}@no-email.local`,
      guest_phone: guestPhone || null,
      quantity: 1,
      amount,
      status: 'paid', // walk-in sales are recorded as already settled
      payment_method: isComplimentary ? 'complimentary' : 'cash',
      has_valid_email: validEmail,
      currency: 'PKR',
    }).select().single();

    if (orderErr || !order) {
      await service.rpc('reserve_ticket', { p_ticket_type_id: ticketTypeId, p_qty: -1 });
      return NextResponse.json({ error: 'Failed to record sale' }, { status: 500 });
    }

    const { data: attendee } = await service.from('attendees').insert({
      event_id: eventId,
      order_id: order.id,
      ticket_type_id: ticketTypeId,
      guest_name: guestName,
      guest_email: guestEmail || null,
      source: 'walk_in',
      status: 'checked_in', // a walk-in sale, by definition, is happening at the point of entry
    }).select().single();

    if (validEmail && attendee) {
      try {
        const { sendTicketConfirmation } = require('@/lib/email');
        const { data: eventDetails } = await service.from('events').select('title, date, time, venue_name, venue_address').eq('id', eventId).single();
        if (eventDetails) {
          await sendTicketConfirmation({
            to: guestEmail,
            guestName,
            eventName: eventDetails.title,
            eventDate: eventDetails.date,
            eventTime: eventDetails.time,
            venueName: eventDetails.venue_name,
            venueAddress: eventDetails.venue_address,
            orderId: order.id,
            attendeeId: attendee.id,
          });
        }
      } catch (e) {
        console.error('Walk-in ticket email failed:', e);
      }
    }

    return NextResponse.json({ order, attendee });
  } catch (error: any) {
    console.error("POST /api/events/[id]/walk-in-sale error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
