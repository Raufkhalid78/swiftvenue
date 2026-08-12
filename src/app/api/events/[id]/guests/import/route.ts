import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { checkEventAccess } from '@/lib/team';
import { checkGuestLimit } from '@/lib/plans';

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

  const rows = guests.map((g: { name: string; email: string }) => ({
    event_id: resolvedParams.id,
    guest_name: g.name,
    guest_email: g.email,
    source: 'bulk_import',
    status: 'registered',
    // also setting ticket defaults to bypass ticket_types foreign keys if needed, 
    // or just let them be empty if not required. The old modal set is_comp=true
    is_comp: true,
    order_id: crypto.randomUUID()
  }));

  const { error, count } = await service.from('attendees').insert(rows, { count: 'exact' });
  if (error) {
    console.error('Bulk import failed:', error);
    return NextResponse.json({ error: 'Import failed, please try again' }, { status: 500 });
  }

  return NextResponse.json({ imported: count ?? rows.length });
}
