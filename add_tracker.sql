-- Run this in your Supabase SQL Editor to support Safepay Hosted Checkout

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS tracker VARCHAR(255);

-- Create an index on the tracker column since we will be looking up orders by tracker
CREATE INDEX IF NOT EXISTS idx_orders_tracker ON public.orders(tracker);
