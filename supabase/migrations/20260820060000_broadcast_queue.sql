-- ============================================================
-- Migration: Asynchronous Broadcast Queue & Delivery Tracking
-- ============================================================

CREATE TABLE IF NOT EXISTS public.broadcast_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  total_recipients INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_broadcast_jobs_event ON public.broadcast_jobs(event_id, created_at DESC);

ALTER TABLE public.broadcast_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "broadcast_jobs_manage_owner" ON public.broadcast_jobs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.events WHERE id = event_id AND user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.event_collaborators WHERE event_id = broadcast_jobs.event_id AND user_id = auth.uid()
    )
  );
