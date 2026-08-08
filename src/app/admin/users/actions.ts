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

export async function updateUserPlan(userId: string, newPlanId: string) {
  try {
    const { user: admin, service } = await checkAdmin();

    const { error } = await service
      .from('profiles')
      .update({ plan: newPlanId })
      .eq('id', userId);

    if (error) throw error;

    await logAdminAction({
      adminId: admin.id,
      action: 'update_plan',
      targetType: 'user',
      targetId: userId,
      details: { new_plan: newPlanId }
    });

    revalidatePath('/admin/users');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to update plan:', error);
    return { success: false, error: error.message };
  }
}

export async function toggleUserSuspension(userId: string, suspend: boolean) {
  try {
    const { user: admin, service } = await checkAdmin();

    const { error } = await service
      .from('profiles')
      .update({ is_suspended: suspend })
      .eq('id', userId);

    if (error) throw error;

    await logAdminAction({
      adminId: admin.id,
      action: suspend ? 'suspend_user' : 'activate_user',
      targetType: 'user',
      targetId: userId,
      details: { is_suspended: suspend }
    });

    revalidatePath('/admin/users');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to toggle suspension:', error);
    return { success: false, error: error.message };
  }
}
