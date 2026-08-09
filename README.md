# SwiftVenue

Event management and ticketing platform for the Pakistani market, built with Next.js (App Router) and Supabase.

## Setup

1. \
pm install\
2. Copy \.env.example\ to \.env.local\ and fill in the values below
3. \
pm run dev\

## Environment variables

### Supabase
- \NEXT_PUBLIC_SUPABASE_URL\
- \NEXT_PUBLIC_SUPABASE_ANON_KEY\
- \SUPABASE_SERVICE_ROLE_KEY\ — server-only, never expose client-side

### Safepay (payment processing)
- \SAFEPAY_V1_SECRET\ or \SAFEPAY_SECRET_KEY\
- \SAFEPAY_API_KEY\ or \SAFEPAY_MERCHANT_API_KEY\
- \SAFEPAY_ENVIRONMENT\ — \sandbox\ or \production\
- \SAFEPAY_WEBHOOK_SECRET\

### Resend (email)
- \RESEND_API_KEY\

### Meta WhatsApp Business (ticket delivery)
- \META_WHATSAPP_TOKEN\
- \META_PHONE_NUMBER_ID\

### Upstash (rate limiting)
- \UPSTASH_REDIS_REST_URL\
- \UPSTASH_REDIS_REST_TOKEN\

### Cron
- \CRON_SECRET\ — verifies scheduled task requests from Vercel

## Architecture overview

- \src/app/(marketing pages)\ — public site: landing, pricing, about, blog
- \src/app/dashboard/*\ — organizer-facing app (auth-gated, \uth.uid() = user_id\ via RLS)
- \src/app/admin/*\ — platform operator panel (auth-gated via \profiles.is_admin\)
- \src/app/e/[slug]\ — public event pages and checkout
- \src/app/api/payment/*\ — Safepay checkout initiation, webhook fulfillment, refunds
- \src/lib/plans.ts\ — plan-tier fee calculation and guest-limit enforcement, shared across checkout paths
- \supabase/schema.sql\ — full database schema, RLS policies, and stored functions

## Testing

\
pm run test\ runs the Vitest suite — currently focused on fee calculation, guest-limit enforcement, and webhook fulfillment logic to prevent regressions in the most critical money paths.
