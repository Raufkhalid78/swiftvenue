CREATE TABLE IF NOT EXISTS public.promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
    discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
    max_uses INTEGER,
    current_uses INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(event_id, code)
);

-- RLS Policies
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Admins and owners can manage promo codes for their events
CREATE POLICY "Organizers can manage their event promo codes"
ON public.promo_codes
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.events
        WHERE events.id = promo_codes.event_id
        AND events.user_id = auth.uid()
    )
);

-- Anyone can read promo codes (we will validate them in the RPC/backend)
-- Actually, we shouldn't let people list all promo codes. 
-- The validation will happen via a SECURITY DEFINER function or server-side API.
-- So no public select policy is needed.

-- Add index for fast lookups
CREATE INDEX idx_promo_codes_event_code ON public.promo_codes(event_id, code);
