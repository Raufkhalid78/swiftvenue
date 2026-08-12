import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// We must use the service role key to bypass RLS for public scanning, 
// because sponsors are scanning via an unauthenticated magic link.
// However, we implemented RLS to allow anon inserts. We can just use the anon client if we want, 
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sponsorId: string }> }
) {
  try {
    const { sponsorId } = await params;
    const body = await request.json();
    const { attendeeId } = body;

    if (!sponsorId || !attendeeId) {
      return NextResponse.json({ error: 'Missing sponsor or attendee ID' }, { status: 400 });
    }

    // 1. Verify sponsor exists and get its event_id
    const { data: sponsor, error: sponsorError } = await supabase
      .from('event_sponsors')
      .select('event_id')
      .eq('id', sponsorId)
      .single();

    if (sponsorError || !sponsor) {
      return NextResponse.json({ error: 'Invalid sponsor' }, { status: 404 });
    }

    // 2. Verify attendee exists and belongs to the same event
    const { data: attendee, error: attendeeError } = await supabase
      .from('attendees')
      .select('id, event_id, guest_name, status, ticket_types(name)')
      .eq('id', attendeeId)
      .single();

    if (attendeeError || !attendee) {
      return NextResponse.json({ error: 'Invalid QR code (Attendee not found)' }, { status: 404 });
    }

    if (attendee.event_id !== sponsor.event_id) {
      return NextResponse.json({ error: 'Attendee belongs to a different event' }, { status: 403 });
    }

    // 3. Insert the lead
    const { error: insertError } = await supabase
      .from('sponsor_leads')
      .insert([
        {
          sponsor_id: sponsorId,
          attendee_id: attendeeId,
        }
      ]);

    if (insertError) {
      if (insertError.code === '23505') { // unique violation
        return NextResponse.json({ error: 'Lead already collected' }, { status: 400 });
      }
      console.error('Failed to insert lead:', insertError);
      return NextResponse.json({ error: 'Failed to save lead' }, { status: 500 });
    }

    // Return attendee details for immediate visual feedback
    return NextResponse.json({
      success: true,
      attendee: {
        guest_name: attendee.guest_name,
        ticket_type: Array.isArray(attendee.ticket_types) 
          ? (attendee.ticket_types[0] as any)?.name 
          : (attendee.ticket_types as any)?.name || 'Standard'
      }
    });
  } catch (error) {
    console.error('Sponsor scan error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
