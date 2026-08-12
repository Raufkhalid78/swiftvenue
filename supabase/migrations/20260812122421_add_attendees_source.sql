ALTER TABLE public.attendees
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'ticket_purchase'
  CHECK (source IN ('ticket_purchase', 'bulk_import', 'free_rsvp'));
