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

export async function updateMessageStatus(messageId: string, status: 'read' | 'resolved') {
  try {
    const { user: admin, service } = await checkAdmin();

    const { error } = await service
      .from('contact_messages')
      .update({ status })
      .eq('id', messageId);

    if (error) throw error;

    await logAdminAction({
      adminId: admin.id,
      action: 'update_message',
      targetType: 'message',
      targetId: messageId,
    });

    revalidatePath('/admin/messages');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to update message:', error);
    return { success: false, error: error.message };
  }
}
