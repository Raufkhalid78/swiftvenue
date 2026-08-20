-- Migration: 20260820090000_event_archival_lifecycle.sql
-- Description: Add support for 'archived' status in events table and column for archival timestamp.

-- 1. Update events status check constraint
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_status_check;
ALTER TABLE public.events ADD CONSTRAINT events_status_check 
  CHECK (status IN ('draft', 'published', 'archived'));

-- 2. Add archived_at timestamp column
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- 3. Index on status and date for fast cron queries
CREATE INDEX IF NOT EXISTS idx_events_status_date ON public.events (status, date);
