-- ============================================================
-- SwiftVenue — Supabase Schema
-- Run this entire file in the Supabase SQL Editor
-- ============================================================

-- ─── Enable UUID extension ───────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Profiles (auto-created on auth.users insert) ───────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  email       TEXT,
  plan        TEXT DEFAULT 'free',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Events ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.events (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title                 TEXT NOT NULL,
  slug                  TEXT UNIQUE NOT NULL,
  type                  TEXT NOT NULL CHECK (type IN ('corporate', 'social', 'cultural', 'educational')),
  description           TEXT,
  date                  TEXT NOT NULL,
  time                  TEXT,
  venue_name            TEXT,
  venue_address         TEXT,
  hero_image_url        TEXT,
  status                TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  theme_color           TEXT DEFAULT '#0f172a',
  template_id           TEXT DEFAULT 'modern' CHECK (template_id IN ('modern', 'minimalist', 'classic')),
  ticket_price          NUMERIC(10, 2) DEFAULT 0.00,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Agenda Items ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agenda_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id        UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  start_time      TEXT,
  end_time        TEXT,
  description     TEXT,
  speaker_name    TEXT,
  order_index     INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Attendees ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.attendees (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id        UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  guest_name      TEXT NOT NULL,
  guest_email     TEXT,
  ticket_type     TEXT DEFAULT 'general',
  status          TEXT NOT NULL CHECK (status IN ('registered', 'attended', 'cancelled')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Orders (Ticket Purchases) ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id        UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  guest_name      TEXT NOT NULL,
  guest_email     TEXT NOT NULL,
  amount          NUMERIC(10, 2) NOT NULL,
  currency        TEXT DEFAULT 'PKR',
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  tracker         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Trigger: auto-create profile on signup ──────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── Trigger: auto-update updated_at ────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_events_updated_at ON public.events;
CREATE TRIGGER set_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ─── Row-Level Security ───────────────────────────────────────
ALTER TABLE public.profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendees    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders       ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Events: owners can do everything
CREATE POLICY "events_select_own"  ON public.events FOR SELECT  USING (auth.uid() = user_id);
CREATE POLICY "events_insert_own"  ON public.events FOR INSERT  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "events_update_own"  ON public.events FOR UPDATE  USING (auth.uid() = user_id);
CREATE POLICY "events_delete_own"  ON public.events FOR DELETE  USING (auth.uid() = user_id);
-- Public can read published events
CREATE POLICY "events_select_published" ON public.events FOR SELECT USING (status = 'published');

-- Agenda Items: follow event ownership
CREATE POLICY "agenda_select" ON public.agenda_items FOR SELECT USING (
  event_id IN (SELECT id FROM public.events WHERE user_id = auth.uid() OR status = 'published')
);
CREATE POLICY "agenda_insert_own" ON public.agenda_items FOR INSERT WITH CHECK (
  event_id IN (SELECT id FROM public.events WHERE user_id = auth.uid())
);
CREATE POLICY "agenda_update_own" ON public.agenda_items FOR UPDATE USING (
  event_id IN (SELECT id FROM public.events WHERE user_id = auth.uid())
);
CREATE POLICY "agenda_delete_own" ON public.agenda_items FOR DELETE USING (
  event_id IN (SELECT id FROM public.events WHERE user_id = auth.uid())
);

-- Attendees: anyone can insert, owner can select all
CREATE POLICY "attendees_insert_public"  ON public.attendees FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "attendees_select_owner"   ON public.attendees FOR SELECT USING (
  event_id IN (SELECT id FROM public.events WHERE user_id = auth.uid())
);

-- Orders: anyone can insert, owner can select all
CREATE POLICY "orders_insert_public" ON public.orders FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "orders_select_owner" ON public.orders FOR SELECT USING (
  event_id IN (SELECT id FROM public.events WHERE user_id = auth.uid())
);

-- ─── Storage bucket ──────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', TRUE)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "event_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'event-images');

CREATE POLICY "event_images_auth_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'event-images' AND auth.role() = 'authenticated'
  );

CREATE POLICY "event_images_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'event-images' AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );
