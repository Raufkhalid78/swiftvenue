-- Create an RPC to safely cleanup stale orders (>24 hours) with their cascading dependencies
CREATE OR REPLACE FUNCTION public.cleanup_stale_orders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stale_order_ids uuid[];
  v_count integer := 0;
BEGIN
  -- 1. Identify all stale orders (>24 hours old, and either pending, cancelled, or expired)
  SELECT array_agg(id)
  INTO v_stale_order_ids
  FROM public.orders
  WHERE status IN ('pending', 'cancelled', 'expired')
    AND created_at < (NOW() - INTERVAL '24 hours');

  -- If there are no stale orders, exit early
  IF v_stale_order_ids IS NULL OR array_length(v_stale_order_ids, 1) = 0 THEN
    RETURN 0;
  END IF;

  v_count := array_length(v_stale_order_ids, 1);

  -- 2. Delete dependent records manually to avoid foreign key constraint violations
  -- (Since 'orders' doesn't use ON DELETE CASCADE for these relations by default)
  
  -- Delete attendees linked to these orders
  DELETE FROM public.attendees
  WHERE order_id = ANY(v_stale_order_ids);

  -- Delete affiliate referrals linked to these orders
  DELETE FROM public.affiliate_referrals
  WHERE order_id = ANY(v_stale_order_ids);

  -- 3. Delete the orders themselves
  DELETE FROM public.orders
  WHERE id = ANY(v_stale_order_ids);

  RETURN v_count;
END;
$$;
