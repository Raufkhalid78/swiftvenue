import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  // Verify this is actually called by Vercel Cron, not a public hit
  const authHeader = request.headers.get('authorization');
  if (authHeader !== \Bearer ${process.env.CRON_SECRET}\) {
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

  // 3. Placeholder for reminder emails — added in Sprint 2, item 5
  // await sendEventReminders(service);

  return NextResponse.json({ ok: true, results });
}