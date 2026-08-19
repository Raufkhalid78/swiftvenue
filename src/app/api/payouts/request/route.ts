import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { calculateRemainingDailyAllowance, MIN_PAYOUT_AMOUNT, PAYOUT_PROCESSING_FEE } from '@/lib/payout-limits';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const service = createServiceClient();

    // Authenticate the organizer
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventIds, amount: requestedCustomAmount } = await request.json();
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

    // Fetch user profile for plan details
    const { data: profile } = await service
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single();

    const userPlan = profile?.plan || 'free';

    // 1. Check for an existing pending payout to avoid concurrent double requests
    const { data: existingPending } = await service
      .from('payouts')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .limit(1)
      .single();

    if (existingPending) {
      return NextResponse.json({ 
        error: 'You already have a pending payout request in review. Please wait for it to be processed before requesting another.' 
      }, { status: 409 });
    }

    // 2. Query payouts created in the last 24 hours to enforce daily limit
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentPayouts } = await service
      .from('payouts')
      .select('amount, status, created_at')
      .eq('user_id', user.id)
      .gte('created_at', twentyFourHoursAgo);

    const { dailyLimit, usedInLast24h, remainingToday } = calculateRemainingDailyAllowance(
      recentPayouts || [],
      userPlan
    );

    if (remainingToday < MIN_PAYOUT_AMOUNT) {
      return NextResponse.json({
        error: `Daily limit reached. You have already requested Rs ${usedInLast24h.toLocaleString()} of your Rs ${dailyLimit.toLocaleString()} daily allowance in the last 24 hours.`,
        dailyLimit,
        usedInLast24h,
        remainingToday,
      }, { status: 429 });
    }

    // 3. Fetch all paid, non-refunded orders for these events
    const { data: orders, error: ordersErr } = await service
      .from('orders')
      .select('id, amount, platform_fee_amount, organizer_net_amount')
      .in('event_id', validEventIds)
      .eq('status', 'paid')
      .neq('refund_status', 'refunded');

    if (ordersErr || !orders || orders.length === 0) {
      return NextResponse.json({ error: 'No paid orders found to pay out' }, { status: 400 });
    }

    // Fetch previous completed or processing payouts to determine true available balance
    const { data: pastPayouts } = await service
      .from('payouts')
      .select('amount, status')
      .eq('user_id', user.id)
      .in('status', ['paid', 'processing']);

    const totalPaidOrProcessing = (pastPayouts || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);

    // Calculate total net revenue
    const totalNetRevenue = orders.reduce((sum, order) => {
      const net = order.organizer_net_amount != null
        ? Number(order.organizer_net_amount)
        : Math.max(0, Number(order.amount || 0) - Number(order.platform_fee_amount || 0));
      return sum + net;
    }, 0);

    const availableBalance = Math.max(0, totalNetRevenue - totalPaidOrProcessing);

    if (availableBalance < MIN_PAYOUT_AMOUNT) {
      return NextResponse.json({ 
        error: `Minimum available balance to request a payout is Rs ${MIN_PAYOUT_AMOUNT.toLocaleString()}` 
      }, { status: 400 });
    }

    // Determine requested amount
    let targetAmount = requestedCustomAmount ? Number(requestedCustomAmount) : Math.min(availableBalance, remainingToday);

    if (isNaN(targetAmount) || targetAmount < MIN_PAYOUT_AMOUNT) {
      return NextResponse.json({ 
        error: `Minimum payout request amount is Rs ${MIN_PAYOUT_AMOUNT.toLocaleString()}` 
      }, { status: 400 });
    }

    if (targetAmount > availableBalance) {
      return NextResponse.json({ 
        error: `Requested amount (Rs ${targetAmount.toLocaleString()}) exceeds your available balance of Rs ${availableBalance.toLocaleString()}` 
      }, { status: 400 });
    }

    if (targetAmount > remainingToday) {
      return NextResponse.json({ 
        error: `Requested amount (Rs ${targetAmount.toLocaleString()}) exceeds your remaining daily limit of Rs ${remainingToday.toLocaleString()} (Plan limit: Rs ${dailyLimit.toLocaleString()}/day)` 
      }, { status: 400 });
    }

    const disbursedAmount = Math.max(0, targetAmount - PAYOUT_PROCESSING_FEE);

    // Insert the payout request
    const { data: newPayout, error: insertErr } = await service
      .from('payouts')
      .insert({
        user_id: user.id,
        amount: disbursedAmount,
        order_ids: orders.map(o => o.id),
        status: 'pending',
      })
      .select()
      .single();

    if (insertErr) {
      console.error('Failed to insert payout:', insertErr);
      return NextResponse.json({ error: 'Failed to create payout request' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      payoutId: newPayout.id,
      requestedAmount: targetAmount,
      fee: PAYOUT_PROCESSING_FEE,
      disbursedAmount,
      remainingDailyAllowance: remainingToday - targetAmount
    });
  } catch (err) {
    console.error('Payout request error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
