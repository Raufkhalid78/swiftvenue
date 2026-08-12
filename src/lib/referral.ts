import { SupabaseClient } from '@supabase/supabase-js';

export async function createReferralCode(
  supabase: SupabaseClient, 
  eventId: string, 
  guestName: string, 
  _orderId: string
) {
  const prefix = guestName.split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '') || 'REF';
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  const code = `${prefix}-10-${randomStr}`;

  // Try primary code; if unique constraint fails, append extra suffix and retry once
  const tryInsert = async (c: string) => supabase
    .from('promo_codes')
    .insert({
      event_id: eventId,
      code: c,
      discount_type: 'percentage',
      discount_amount: 10,
      is_active: true,
      is_referral_code: true
    })
    .select('code')
    .single();

  let { data, error } = await tryInsert(code);

  if (error?.code === '23505') {
    // Unique violation — retry with an extra random suffix
    const fallback = `${code}-${Math.random().toString(36).substring(2, 4).toUpperCase()}`;
    ({ data, error } = await tryInsert(fallback));
  }

  if (error) {
    console.error('Failed to create referral code:', error.code, error.message);
    return null; // Non-fatal — don't crash the ticket purchase
  }

  return data?.code ?? null;
}
