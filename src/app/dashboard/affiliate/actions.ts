'use server';

import { createClient, createServiceClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getAffiliateData() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) return { error: 'Unauthorized' };

  // Check if they are an approved affiliate (match by user_id OR email)
  const { data: app } = await supabase
    .from('affiliate_applications')
    .select('*')
    .or(`user_id.eq.${session.user.id},email.eq.${session.user.email}`)
    .limit(1)
    .maybeSingle();

  if (!app) {
    return { error: 'Not an approved affiliate' };
  }

  // Auto-link user_id if it is missing
  if (!app.user_id) {
    await supabase
      .from('affiliate_applications')
      .update({ user_id: session.user.id })
      .eq('id', app.id);
    app.user_id = session.user.id;
  }

  if (app.status !== 'approved') {
    return { error: 'Not an approved affiliate', application: app };
  }

  // Get their referral code
  const { data: refCode } = await supabase
    .from('referral_codes')
    .select('*')
    .eq('user_id', session.user.id)
    .single();

  // Get their commissions
  const { data: commissions } = await supabase
    .from('affiliate_commissions')
    .select('*')
    .eq('affiliate_id', session.user.id)
    .order('created_at', { ascending: false });

  // Calculate stats
  let totalEarnings = 0;
  let pendingPayout = 0;
  
  if (commissions) {
    for (const c of commissions) {
      if (c.status === 'paid' || c.status === 'cleared') {
        totalEarnings += Number(c.commission_amount);
      }
      if (c.status === 'pending' || c.status === 'cleared') {
        pendingPayout += Number(c.commission_amount);
      }
    }
  }

  return {
    success: true,
    application: app,
    referralCode: refCode,
    commissions: commissions || [],
    stats: {
      totalEarnings,
      pendingPayout,
      totalSales: commissions?.length || 0
    }
  };
}

export async function updatePayoutDetails(formData: FormData) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) return { error: 'Unauthorized' };

  const details = formData.get('payout_details') as string;

  const { error } = await supabase
    .from('affiliate_applications')
    .update({ payout_details: details })
    .eq('user_id', session.user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/affiliate');
  return { success: true };
}

export async function generateReferralCode(customCode: string) {
  const authSupabase = await createClient();
  const { data: { session } } = await authSupabase.auth.getSession();
  
  if (!session) return { error: 'Unauthorized' };

  if (!customCode || customCode.length < 3) {
    return { error: 'Code must be at least 3 characters long' };
  }

  // Validate alphanumeric and uppercase
  const code = customCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (code !== customCode.toUpperCase()) {
    return { error: 'Code can only contain letters and numbers' };
  }

  const service = createServiceClient();

  // Check if code is already taken by someone else
  const { data: existingCode } = await service
    .from('referral_codes')
    .select('id, user_id')
    .eq('code', code)
    .maybeSingle();

  if (existingCode && existingCode.user_id !== session.user.id) {
    return { error: 'This code is already taken. Please choose another.' };
  }

  // Check if the user already has a referral code
  const { data: userCode } = await service
    .from('referral_codes')
    .select('*')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (userCode) {
    if (userCode.max_uses === null) {
      return { error: 'You have already created your custom affiliate code.' };
    }
    // Update existing code to the custom code, 10% discount, and unlimited uses
    const { error: updateError } = await service
      .from('referral_codes')
      .update({
        code,
        discount_percent: 10,
        max_uses: null
      })
      .eq('id', userCode.id);

    if (updateError) return { error: 'Failed to update your code.' };
  } else {
    // Insert new code
    const { error: insertError } = await service
      .from('referral_codes')
      .insert({
        code,
        discount_percent: 10,
        max_uses: null, // unlimited
        user_id: session.user.id
      });

    if (insertError) return { error: 'Failed to generate code.' };
  }

  revalidatePath('/dashboard/affiliate');
  return { success: true };
}
