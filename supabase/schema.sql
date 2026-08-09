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
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  is_admin    BOOLEAN DEFAULT FALSE
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
  order_id        UUID REFERENCES public.orders(id),
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

-- ─── Phase 1: Real Ticketing Data Model ──────────────────────

-- Ticket types per event (replaces flat events.ticket_price)
CREATE TABLE IF NOT EXISTS public.ticket_types (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id        UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,               -- "Early Bird", "General Admission", "VIP"
  description     TEXT,
  price           NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency        TEXT DEFAULT 'PKR',
  quantity_total  INT NOT NULL,                -- total inventory for this tier
  quantity_sold   INT NOT NULL DEFAULT 0,      -- updated atomically on purchase
  sales_start     TIMESTAMPTZ,                 -- null = starts immediately
  sales_end       TIMESTAMPTZ,                 -- null = no end / manual close
  order_index     INT DEFAULT 0,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Link orders to a specific ticket type instead of a bare amount
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS ticket_type_id UUID REFERENCES public.ticket_types(id),
  ADD COLUMN IF NOT EXISTS quantity INT NOT NULL DEFAULT 1;

-- Same for attendees, replacing the free-text ticket_type column
ALTER TABLE public.attendees
  ADD COLUMN IF NOT EXISTS ticket_type_id UUID REFERENCES public.ticket_types(id);

-- Row-Level Security for Ticket Types
ALTER TABLE public.ticket_types ENABLE ROW LEVEL SECURITY;

-- Public can read ticket types for published events, owner can do everything
CREATE POLICY "ticket_types_select" ON public.ticket_types FOR SELECT USING (
  event_id IN (SELECT id FROM public.events WHERE user_id = auth.uid() OR status = 'published')
);
CREATE POLICY "ticket_types_insert_own" ON public.ticket_types FOR INSERT WITH CHECK (
  event_id IN (SELECT id FROM public.events WHERE user_id = auth.uid())
);
CREATE POLICY "ticket_types_update_own" ON public.ticket_types FOR UPDATE USING (
  event_id IN (SELECT id FROM public.events WHERE user_id = auth.uid())
);
CREATE POLICY "ticket_types_delete_own" ON public.ticket_types FOR DELETE USING (
  event_id IN (SELECT id FROM public.events WHERE user_id = auth.uid())
);

-- Atomic inventory control function
CREATE OR REPLACE FUNCTION public.reserve_ticket(
  p_ticket_type_id UUID, p_qty INT
) RETURNS BOOLEAN AS $$
DECLARE
  updated_rows INT;
BEGIN
  UPDATE public.ticket_types
  SET quantity_sold = quantity_sold + p_qty
  WHERE id = p_ticket_type_id
    AND quantity_sold + p_qty <= quantity_total
    AND is_active = TRUE
    AND (sales_start IS NULL OR sales_start <= NOW())
    AND (sales_end IS NULL OR sales_end >= NOW());
  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  RETURN updated_rows > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─── Phase 2 & 3 & 5: Premium Features Tables ────────────────

-- Promo Codes
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id        UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  code            TEXT NOT NULL,
  discount_type   TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_amount NUMERIC(10,2) NOT NULL,
  max_uses        INT,
  current_uses    INT DEFAULT 0,
  valid_from      TIMESTAMPTZ,
  valid_until     TIMESTAMPTZ,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, code)
);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "promo_codes_select" ON public.promo_codes FOR SELECT USING (
  event_id IN (SELECT id FROM public.events WHERE user_id = auth.uid() OR status = 'published')
);
CREATE POLICY "promo_codes_insert_own" ON public.promo_codes FOR INSERT WITH CHECK (
  event_id IN (SELECT id FROM public.events WHERE user_id = auth.uid())
);
CREATE POLICY "promo_codes_update_own" ON public.promo_codes FOR UPDATE USING (
  event_id IN (SELECT id FROM public.events WHERE user_id = auth.uid())
);
CREATE POLICY "promo_codes_delete_own" ON public.promo_codes FOR DELETE USING (
  event_id IN (SELECT id FROM public.events WHERE user_id = auth.uid())
);

-- Waitlists
CREATE TABLE IF NOT EXISTS public.waitlists (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id        UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  ticket_type_id  UUID NOT NULL REFERENCES public.ticket_types(id) ON DELETE CASCADE,
  guest_name      TEXT NOT NULL,
  guest_email     TEXT NOT NULL,
  status          TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'purchased', 'expired')),
  notified_at     TIMESTAMPTZ,
  offer_expires_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.waitlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "waitlists_insert_public" ON public.waitlists FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "waitlists_select_owner" ON public.waitlists FOR SELECT USING (
  event_id IN (SELECT id FROM public.events WHERE user_id = auth.uid())
);
CREATE POLICY "waitlists_update_owner" ON public.waitlists FOR UPDATE USING (
  event_id IN (SELECT id FROM public.events WHERE user_id = auth.uid())
);
CREATE POLICY "waitlists_delete_owner" ON public.waitlists FOR DELETE USING (
  event_id IN (SELECT id FROM public.events WHERE user_id = auth.uid())
);

CREATE OR REPLACE FUNCTION public.notify_next_waitlist_entry(p_ticket_type_id UUID)
RETURNS UUID AS $$
DECLARE v_entry_id UUID;
BEGIN
  SELECT id INTO v_entry_id FROM public.waitlists
  WHERE ticket_type_id = p_ticket_type_id AND status = 'waiting'
  ORDER BY created_at ASC LIMIT 1;

  IF v_entry_id IS NOT NULL THEN
    UPDATE public.waitlists
    SET status = 'notified', notified_at = NOW(), offer_expires_at = NOW() + INTERVAL '15 minutes'
    WHERE id = v_entry_id;
  END IF;

  RETURN v_entry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS promo_code TEXT,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0;

-- --- Pricing Model & Payouts (Phase 1) -----------------------

CREATE TABLE IF NOT EXISTS public.plans (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  monthly_price     NUMERIC(10,2),
  yearly_price      NUMERIC(10,2),
  fee_percent       NUMERIC(5,2) NOT NULL,
  fee_fixed         NUMERIC(10,2) NOT NULL,
  max_concurrent_paid_events INT,
  remove_branding   BOOLEAN DEFAULT FALSE,
  broadcast_limit   INT,
  max_guests_per_event INT
);

-- Ensure column exists if table was already created
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS max_guests_per_event INT;

INSERT INTO public.plans (id, name, monthly_price, yearly_price, fee_percent, fee_fixed, max_concurrent_paid_events, remove_branding, broadcast_limit, max_guests_per_event) VALUES
  ('free', 'Free', 0, 0, 7.00, 30.00, 1, FALSE, 1, 100),
  ('pro', 'Pro', 3500, 35000, 3.00, 15.00, NULL, TRUE, NULL, 1000),
  ('enterprise', 'Enterprise', NULL, NULL, 2.00, 0.00, NULL, TRUE, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET 
  max_guests_per_event = EXCLUDED.max_guests_per_event;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_plan_fk FOREIGN KEY (plan) REFERENCES public.plans(id);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans_select_public" ON public.plans FOR SELECT USING (TRUE);

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS platform_fee_amount NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS organizer_net_amount NUMERIC(10,2);

CREATE TABLE IF NOT EXISTS public.organizer_payout_methods (
  user_id       UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  method        TEXT CHECK (method IN ('bank', 'jazzcash', 'easypaisa')),
  account_details JSONB,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payouts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id),
  amount        NUMERIC(10,2) NOT NULL,
  order_ids     UUID[] NOT NULL,
  status        TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed')),
  paid_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Organizer Payouts
ALTER TABLE public.organizer_payout_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_payout_methods_select_own" ON public.organizer_payout_methods FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "org_payout_methods_insert_own" ON public.organizer_payout_methods FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "org_payout_methods_update_own" ON public.organizer_payout_methods FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "payouts_select_own" ON public.payouts FOR SELECT USING (auth.uid() = user_id);


-- --- Upgrade Requests (Phase 4) -----------------------

CREATE TABLE IF NOT EXISTS public.upgrade_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id         TEXT NOT NULL REFERENCES public.plans(id),
  reference_number TEXT NOT NULL,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.upgrade_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "upgrade_requests_select_own" ON public.upgrade_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "upgrade_requests_insert_own" ON public.upgrade_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "upgrade_requests_select_admin" ON public.upgrade_requests FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);


-- --- Sprint 2: Refunds & Team Collaboration ------------------

-- 1. Phone numbers and refund tracking
ALTER TABLE public.attendees
  ADD COLUMN IF NOT EXISTS guest_phone TEXT;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS guest_phone TEXT,
  ADD COLUMN IF NOT EXISTS refund_status TEXT DEFAULT 'none' CHECK (refund_status IN ('none', 'requested', 'refunded')),
  ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(10, 2) DEFAULT 0.00;

-- 2. Team Accounts
CREATE TABLE IF NOT EXISTS public.event_collaborators (
  event_id        UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role            TEXT DEFAULT 'editor' CHECK (role IN ('editor', 'viewer')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (event_id, user_id)
);

ALTER TABLE public.event_collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_collaborators_select" ON public.event_collaborators FOR SELECT USING (
  event_id IN (SELECT id FROM public.events WHERE user_id = auth.uid()) OR user_id = auth.uid()
);
CREATE POLICY "event_collaborators_insert" ON public.event_collaborators FOR INSERT WITH CHECK (
  event_id IN (SELECT id FROM public.events WHERE user_id = auth.uid())
);
CREATE POLICY "event_collaborators_delete" ON public.event_collaborators FOR DELETE USING (
  event_id IN (SELECT id FROM public.events WHERE user_id = auth.uid()) OR user_id = auth.uid()
);

-- Access helper for policies
CREATE OR REPLACE FUNCTION public.check_event_access(p_event_id UUID)
RETURNS BOOLEAN AS $body
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.events WHERE id = p_event_id AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.event_collaborators WHERE event_id = p_event_id AND user_id = auth.uid()
  );
END;
$body LANGUAGE plpgsql SECURITY DEFINER;

-- Update Events RLS
DROP POLICY IF EXISTS "events_update_own" ON public.events;
CREATE POLICY "events_update_own" ON public.events FOR UPDATE USING (
  user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.event_collaborators WHERE event_id = id AND user_id = auth.uid() AND role = 'editor'
  )
);

-- Update Orders RLS
DROP POLICY IF EXISTS "orders_select_owner" ON public.orders;
CREATE POLICY "orders_select_owner" ON public.orders FOR SELECT USING (
  public.check_event_access(event_id)
);

-- Update Attendees RLS
DROP POLICY IF EXISTS "attendees_select_owner" ON public.attendees;
CREATE POLICY "attendees_select_owner" ON public.attendees FOR SELECT USING (
  public.check_event_access(event_id)
);

-- Update Ticket Types RLS
DROP POLICY IF EXISTS "ticket_types_select" ON public.ticket_types;
CREATE POLICY "ticket_types_select" ON public.ticket_types FOR SELECT USING (
  public.check_event_access(event_id) OR event_id IN (SELECT id FROM public.events WHERE status = 'published')
);

DROP POLICY IF EXISTS "ticket_types_insert_own" ON public.ticket_types;
CREATE POLICY "ticket_types_insert_own" ON public.ticket_types FOR INSERT WITH CHECK (
  public.check_event_access(event_id)
);

DROP POLICY IF EXISTS "ticket_types_update_own" ON public.ticket_types;
CREATE POLICY "ticket_types_update_own" ON public.ticket_types FOR UPDATE USING (
  public.check_event_access(event_id)
);

DROP POLICY IF EXISTS "ticket_types_delete_own" ON public.ticket_types;
CREATE POLICY "ticket_types_delete_own" ON public.ticket_types FOR DELETE USING (
  public.check_event_access(event_id)
);

-- --- Phase 0: Contact Messages ---------------------------------
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT, 
  email TEXT, 
  message TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contact_messages_insert" ON public.contact_messages FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "contact_messages_select_admin" ON public.contact_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);
CREATE POLICY "contact_messages_update_admin" ON public.contact_messages FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- --- Phase 1: Admin Audit Log ---------------------------------
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_audit_log_select_admin" ON public.admin_audit_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);
CREATE POLICY "admin_audit_log_insert_admin" ON public.admin_audit_log FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- --- Phase 2: User Management ---------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;

-- --- Phase 4: Organizer Payouts -------------------------------
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS payout_status TEXT DEFAULT 'pending' CHECK (payout_status IN ('pending', 'processing', 'paid'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bank_details JSONB DEFAULT NULL;

-- --- Phase 5: Affiliates, Messages, Refunds -------------------

CREATE TABLE IF NOT EXISTS public.affiliate_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id),
  name TEXT,
  email TEXT,
  website TEXT,
  audience TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  payout_details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.referral_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id),
  code TEXT UNIQUE,
  discount_percent NUMERIC(5,2),
  max_uses INT,
  current_uses INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id UUID REFERENCES public.profiles(id),
  order_id UUID REFERENCES public.orders(id),
  commission_amount NUMERIC(10,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'cleared', 'paid')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- Function to expire stale pending orders (older than 30 mins) and release inventory
CREATE OR REPLACE FUNCTION public.expire_stale_orders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$$
DECLARE
  v_order RECORD;
  v_count integer := 0;
BEGIN
  FOR v_order IN
    SELECT id, ticket_type_id, quantity
    FROM public.orders
    WHERE status = 'pending'
      AND created_at < (NOW() - INTERVAL '30 minutes')
  LOOP
    -- Mark order as cancelled
    UPDATE public.orders
    SET status = 'cancelled'
    WHERE id = v_order.id;

    -- Release ticket capacity
    PERFORM public.reserve_ticket(v_order.ticket_type_id, -(v_order.quantity));

    -- Attempt to notify next waitlist entry
    PERFORM public.notify_next_waitlist_entry(v_order.ticket_type_id);

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$$;

