-- ============================================================
-- Migration: Advanced Tier-Specific Promo Codes & Volume Rules
-- ============================================================

ALTER TABLE public.promo_codes
  ADD COLUMN IF NOT EXISTS applicable_ticket_type_ids UUID[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS min_quantity INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS min_order_amount NUMERIC(10,2) DEFAULT 0;
