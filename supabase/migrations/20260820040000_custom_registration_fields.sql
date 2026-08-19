-- ============================================================
-- Migration: Custom Registration Questions & Attendee Responses
-- ============================================================

ALTER TABLE public.ticket_types
  ADD COLUMN IF NOT EXISTS custom_questions JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.attendees
  ADD COLUMN IF NOT EXISTS custom_responses JSONB DEFAULT '{}'::jsonb;
