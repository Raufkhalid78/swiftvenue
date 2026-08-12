import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Papa from 'papaparse';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sponsorId: string }> }
) {
  try {
    const { sponsorId } = await params;

    // 1. Fetch sponsor details for the filename
    const { data: sponsor } = await supabase
      .from('event_sponsors')
      .select('name')
      .eq('id', sponsorId)
      .single();

    if (!sponsor) {
      return new NextResponse('Sponsor not found', { status: 404 });
    }

    // 2. Fetch leads
    const { data: leads } = await supabase
      .from('sponsor_leads')
      .select(`
        scanned_at,
        attendees(guest_name, guest_email, ticket_types(name))
      `)
      .eq('sponsor_id', sponsorId)
      .order('scanned_at', { ascending: false });

    const formattedData = (leads || []).map((lead: any) => ({
      'Name': lead.attendees?.guest_name || 'N/A',
      'Email': lead.attendees?.guest_email || 'N/A',
      'Ticket Type': Array.isArray(lead.attendees?.ticket_types) 
        ? lead.attendees?.ticket_types[0]?.name 
        : lead.attendees?.ticket_types?.name || 'Standard',
      'Scanned At': new Date(lead.scanned_at).toLocaleString()
    }));

    const csv = Papa.unparse(formattedData);

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${sponsor.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_leads.csv"`
      }
    });
  } catch (error) {
    console.error('Failed to export leads:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
