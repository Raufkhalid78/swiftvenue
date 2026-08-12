import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const service = createServiceClient();

    // Authenticate the organizer
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventIds } = await request.json();
    if (!eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
      return NextResponse.json({ error: 'No event IDs provided' }, { status: 400 });
    }

    // Verify all events belong to this organizer
    const { data: events, error: eventsErr } = await service
      .from('events')
      .select('id')
      .eq('user_id', user.id)
      .in('id', eventIds);

    if (eventsErr || !events || events.length === 0) {
      return NextResponse.json({ error: 'No valid events found' }, { status: 403 });
    }

    const validEventIds = events.map(e => e.id);

    // Fetch all paid, non-refunded orders for these events
    const { data: orders, error: ordersErr } = await service
      .from('orders')
      .select('id, amount, platform_fee_amount, organizer_net_amount')
      .in('event_id', validEventIds)
      .eq('status', 'paid')
      .neq('refund_status', 'refunded');

    if (ordersErr || !orders || orders.length === 0) {
      return NextResponse.json({ error: 'No paid orders found to pay out' }, { status: 400 });
    }

    // Calculate total net amount
    const totalAmount = orders.reduce((sum, order) => {
      const net = order.organizer_net_amount != null
        ? Number(order.organizer_net_amount)
        : Math.max(0, Number(order.amount || 0) - Number(order.platform_fee_amount || 0));
      return sum + net;
    }, 0);

    if (totalAmount < 5000) {
      return NextResponse.json({ error: 'Minimum payout amount is Rs 5,000' }, { status: 400 });
    }

    const finalAmount = totalAmount - 350; // Deduct processing fee

    // Check for an existing pending payout to avoid duplicates
    const { data: existing } = await service
      .from('payouts')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .limit(1)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'You already have a pending payout request. Please wait for it to be processed.' }, { status: 409 });
    }

    // Insert the payout request
    const { error: insertErr } = await service
      .from('payouts')
      .insert({
        user_id: user.id,
        amount: finalAmount,
        order_ids: orders.map(o => o.id),
        status: 'pending',
      });

    if (insertErr) {
      console.error('Failed to insert payout:', insertErr);
      return NextResponse.json({ error: 'Failed to create payout request' }, { status: 500 });
    }

    return NextResponse.json({ success: true, amount: totalAmount });
  } catch (err) {
    console.error('Payout request error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
