-- ============================================================
-- Migration: Multi-Day & Multi-Track Agenda Sessions
-- ============================================================

ALTER TABLE public.agenda_items
  ADD COLUMN IF NOT EXISTS day_number INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS capacity INTEGER,
  ADD COLUMN IF NOT EXISTS location_room TEXT,
  ADD COLUMN IF NOT EXISTS registered_count INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.attendee_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attendee_id UUID NOT NULL REFERENCES public.attendees(id) ON DELETE CASCADE,
  agenda_item_id UUID NOT NULL REFERENCES public.agenda_items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(attendee_id, agenda_item_id)
);

CREATE INDEX IF NOT EXISTS idx_attendee_sessions ON public.attendee_sessions(agenda_item_id, attendee_id);

ALTER TABLE public.attendee_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attendee_sessions_select_all" ON public.attendee_sessions
  FOR SELECT USING (TRUE);

CREATE POLICY "attendee_sessions_insert_anon" ON public.attendee_sessions
  FOR INSERT WITH CHECK (TRUE);
