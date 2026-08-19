-- ============================================================
-- Migration: Outbound Webhooks Engine (Zapier/Slack/Make)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.event_webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  subscribed_events TEXT[] DEFAULT ARRAY['order.paid', 'attendee.checked_in', 'ticket.transferred'],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhooks_event_id ON public.event_webhooks(event_id);

CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_id UUID NOT NULL REFERENCES public.event_webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_code INTEGER,
  response_body TEXT,
  duration_ms INTEGER,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries ON public.webhook_deliveries(webhook_id, created_at DESC);

ALTER TABLE public.event_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_webhooks_manage_owner" ON public.event_webhooks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.events WHERE id = event_id AND user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.event_collaborators WHERE event_id = event_webhooks.event_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "webhook_deliveries_select_owner" ON public.webhook_deliveries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.event_webhooks w
      JOIN public.events e ON e.id = w.event_id
      WHERE w.id = webhook_id AND e.user_id = auth.uid()
    )
  );
