ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'online' CHECK (payment_method IN ('online', 'cash', 'complimentary'));
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS has_valid_email BOOLEAN DEFAULT TRUE;

ALTER TABLE public.attendees DROP CONSTRAINT IF EXISTS attendees_source_check;
ALTER TABLE public.attendees ADD CONSTRAINT attendees_source_check
  CHECK (source IN ('ticket_purchase', 'bulk_import', 'free_rsvp', 'walk_in'));
