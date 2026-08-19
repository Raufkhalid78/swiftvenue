-- ============================================================
-- Migration: Self-Serve Ticket Transfers & Reassignment
-- ============================================================

ALTER TABLE public.attendees
  ADD COLUMN IF NOT EXISTS claim_token UUID DEFAULT uuid_generate_v4() UNIQUE,
  ADD COLUMN IF NOT EXISTS original_purchaser_email TEXT,
  ADD COLUMN IF NOT EXISTS transferred_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_attendees_claim_token ON public.attendees(claim_token);
