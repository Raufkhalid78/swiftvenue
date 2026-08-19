-- ============================================================
-- Migration: Event Modality, Virtual Streaming & Media Controls
-- ============================================================

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS modality TEXT DEFAULT 'in_person',
  ADD COLUMN IF NOT EXISTS virtual_stream_url TEXT,
  ADD COLUMN IF NOT EXISTS virtual_platform TEXT,
  ADD COLUMN IF NOT EXISTS end_date DATE,
  ADD COLUMN IF NOT EXISTS end_time TEXT,
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS default_currency TEXT DEFAULT 'PKR';

-- Create index on slug for fast slug verification
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);

-- Update template_id check constraint to support all 9 templates
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_template_id_check;

ALTER TABLE public.events ADD CONSTRAINT events_template_id_check 
  CHECK (template_id IN (
    'modern', 
    'minimalist', 
    'classic', 
    'festival', 
    'gala', 
    'workshop', 
    'tech_summit', 
    'social_mixer', 
    'virtual_stream'
  ));
