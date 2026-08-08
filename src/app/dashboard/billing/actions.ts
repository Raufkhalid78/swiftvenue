'use server';

import { createServiceClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function submitUpgradeRequest(formData: FormData) {
  const service = createServiceClient();
  
  // Get current user
  const { data: { user }, error: authErr } = await service.auth.getUser();
  
  if (authErr || !user) {
    return { error: 'Not authenticated' };
  }

  const planId = formData.get('planId') as string;
  const referenceNumber = formData.get('referenceNumber') as string;

  if (!planId || !referenceNumber) {
    return { error: 'Please provide both the plan and the payment reference number.' };
  }

  // Verify plan exists
  const { data: plan, error: planErr } = await service
    .from('plans')
    .select('id')
    .eq('id', planId)
    .single();

  if (planErr || !plan) {
    return { error: 'Invalid plan selected.' };
  }

  const { error: insertErr } = await service
    .from('upgrade_requests')
    .insert({
      user_id: user.id,
      plan_id: planId,
      reference_number: referenceNumber,
      status: 'pending'
    });

  if (insertErr) {
    console.error('Failed to submit upgrade request:', insertErr);
    return { error: 'Failed to submit request. Please try again later.' };
  }

  revalidatePath('/dashboard/billing');
  return { success: true };
}
