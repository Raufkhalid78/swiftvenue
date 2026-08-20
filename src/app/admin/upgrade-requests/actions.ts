'use server';

import { createServiceClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function approveUpgradeRequest(requestId: string) {
  try {
    const service = createServiceClient();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    const { data: admin } = await service.from('profiles').select('is_admin').eq('id', user.id).single();
    if (!admin?.is_admin) return { error: 'Forbidden' };

    const { data: req } = await service.from('upgrade_requests').select('*').eq('id', requestId).single();
    if (!req) return { error: 'Request not found' };

    // Update the user's plan and mark request as approved in parallel
    await Promise.all([
      service.from('profiles').update({ plan: req.plan_id }).eq('id', req.user_id),
      service.from('upgrade_requests').update({ status: 'approved' }).eq('id', requestId),
    ]);

    revalidatePath('/admin/upgrade-requests');
    return { success: true };
  } catch (err: any) {
    console.error('Failed to approve request:', err);
    return { error: 'Internal Server Error' };
  }
}

export async function rejectUpgradeRequest(requestId: string) {
  try {
    const service = createServiceClient();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    const { data: admin } = await service.from('profiles').select('is_admin').eq('id', user.id).single();
    if (!admin?.is_admin) return { error: 'Forbidden' };

    const { data: req } = await service.from('upgrade_requests').select('*').eq('id', requestId).single();
    if (!req) return { error: 'Request not found' };

    // Just mark request as rejected without touching plan
    await service.from('upgrade_requests').update({ status: 'rejected' }).eq('id', requestId);

    revalidatePath('/admin/upgrade-requests');
    return { success: true };
  } catch (err: any) {
    console.error('Failed to reject request:', err);
    return { error: 'Internal Server Error' };
  }
}
