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

export async function updatePlan(planId: string, updates: any) {
  try {
    const { user: admin, service } = await checkAdmin();

    const { error } = await service
      .from('plans')
      .update(updates)
      .eq('id', planId);

    if (error) throw error;

    await logAdminAction({
      adminId: admin.id,
      action: 'update_plan',
      targetType: 'system',
      targetId: planId,
    });

    revalidatePath('/admin/plans');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to update plan:', error);
    return { success: false, error: error.message };
  }
}
