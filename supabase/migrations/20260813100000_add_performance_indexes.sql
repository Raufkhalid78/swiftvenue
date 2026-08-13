-- Phase 1 Performance Indexes

-- attendees
CREATE INDEX IF NOT EXISTS idx_attendees_event_id ON public.attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_attendees_order_id ON public.attendees(order_id);
CREATE INDEX IF NOT EXISTS idx_attendees_status ON public.attendees(status);

-- orders
CREATE INDEX IF NOT EXISTS idx_orders_event_id ON public.orders(event_id);
CREATE INDEX IF NOT EXISTS idx_orders_tracker ON public.orders(tracker);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- events
CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
-- Note: events.slug already has a UNIQUE constraint and index

-- ticket_types, promo_codes, seats
CREATE INDEX IF NOT EXISTS idx_ticket_types_event_id ON public.ticket_types(event_id);
CREATE INDEX IF NOT EXISTS idx_promo_codes_event_id_code ON public.promo_codes(event_id, code);
CREATE INDEX IF NOT EXISTS idx_seats_layout_id ON public.seats(layout_id);

-- profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Event related tables
CREATE INDEX IF NOT EXISTS idx_event_gallery_event_id ON public.event_gallery(event_id);
CREATE INDEX IF NOT EXISTS idx_event_speakers_event_id ON public.event_speakers(event_id);
CREATE INDEX IF NOT EXISTS idx_event_sponsors_event_id ON public.event_sponsors(event_id);
CREATE INDEX IF NOT EXISTS idx_event_faqs_event_id ON public.event_faqs(event_id);
CREATE INDEX IF NOT EXISTS idx_event_updates_event_id ON public.event_updates(event_id);
CREATE INDEX IF NOT EXISTS idx_waitlists_ticket_type_id ON public.waitlists(ticket_type_id);

-- event_collaborators
CREATE INDEX IF NOT EXISTS idx_event_collaborators_event_user ON public.event_collaborators(event_id, user_id);
