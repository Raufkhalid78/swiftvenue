'use server';

import { createServiceClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';
import { logAdminAction } from '@/lib/admin/audit';
import { revalidatePath } from 'next/cache';

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  
  const service = createServiceClient();
  const { data: admin } = await service.from('profiles').select('is_admin').eq('id', user.id).single();
  if (!admin?.is_admin) throw new Error('Forbidden');
  
  return { user, service };
}

export async function processAffiliateApplication(applicationId: string, status: 'approved' | 'rejected') {
  try {
    const { user: admin, service } = await checkAdmin();

    const { error } = await service
      .from('affiliate_applications')
      .update({ status })
      .eq('id', applicationId);

    if (error) throw error;

    await logAdminAction({
      adminId: admin.id,
      action: status === 'approved' ? 'approve_affiliate' : 'reject_affiliate',
      targetType: 'affiliate_application',
      targetId: applicationId,
    });

    revalidatePath('/admin/affiliates');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to process affiliate application:', error);
    return { success: false, error: error.message };
  }
}

export async function processCommission(commissionId: string) {
  try {
    const { user: admin, service } = await checkAdmin();

    const { error } = await service
      .from('affiliate_commissions')
      .update({ status: 'paid' })
      .eq('id', commissionId);

    if (error) throw error;

    await logAdminAction({
      adminId: admin.id,
      action: 'process_commission',
      targetType: 'commission',
      targetId: commissionId,
    });

    revalidatePath('/admin/affiliates');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to process commission:', error);
    return { success: false, error: error.message };
  }
}
