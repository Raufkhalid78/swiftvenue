-- ============================================================
-- Migration: Real-Time Event Telemetry & Conversion Funnel
-- ============================================================

CREATE TABLE IF NOT EXISTS public.event_telemetry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('page_view', 'initiate_checkout', 'waitlist_join', 'purchase')),
  referrer TEXT,
  utm_source TEXT,
  country_code TEXT,
  device_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telemetry_event_type_created ON public.event_telemetry(event_id, event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_telemetry_country ON public.event_telemetry(event_id, country_code);

ALTER TABLE public.event_telemetry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_telemetry_insert_anon" ON public.event_telemetry
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "event_telemetry_select_owner" ON public.event_telemetry
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events 
      WHERE id = event_id AND user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.event_collaborators 
      WHERE event_id = event_telemetry.event_id AND user_id = auth.uid()
    )
  );
