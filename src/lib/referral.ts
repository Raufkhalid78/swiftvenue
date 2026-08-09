import { SupabaseClient } from '@supabase/supabase-js';

export async function createReferralCode(
  supabase: SupabaseClient, 
  eventId: string, 
  guestName: string, 
  orderId: string
) {
  // Generate a code like JANE-10-XY9Z
  const prefix = guestName.split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '');
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  const code = `${prefix}-10-${randomStr}`;

  const { data, error } = await supabase
    .from('promo_codes')
    .insert({
      event_id: eventId,
      code: code,
      discount_type: 'percentage',
      discount_amount: 10, // 10% off
      is_active: true
    })
    .select('code')
    .single();

  if (error) {
    console.error("Failed to create referral code:", error);
    return null;
  }

  // Optionally, associate this code with the order so we can track rewards
  // For now, we just return the code.
  return data.code;
}
