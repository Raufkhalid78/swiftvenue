import { createServiceClient } from '@/lib/supabase/server';

export type AuditAction = 
  | 'approve_upgrade'
  | 'reject_upgrade'
  | 'suspend_user'
  | 'activate_user'
  | 'delete_event'
  | 'process_payout'
  | 'process_refund'
  | 'update_plan'
  | 'update_settings'
  | 'approve_affiliate'
  | 'reject_affiliate'
  | 'process_commission'
  | 'update_message';

export type TargetType = 
  | 'upgrade_request'
  | 'user'
  | 'event'
  | 'payout'
  | 'order'
  | 'plan'
  | 'system'
  | 'affiliate_application'
  | 'commission'
  | 'message';

interface LogAuditParams {
  adminId: string;
  action: AuditAction;
  targetType: TargetType;
  targetId?: string;
  details?: Record<string, any>;
}

export async function logAdminAction({
  adminId,
  action,
  targetType,
  targetId,
  details
}: LogAuditParams) {
  const service = createServiceClient();
  
  const { error } = await service
    .from('admin_audit_log')
    .insert({
      admin_id: adminId,
      action,
      target_type: targetType,
      target_id: targetId,
      details,
    });

  if (error) {
    console.error('Failed to write admin audit log:', error);
    // We intentionally don't throw here to avoid failing the primary business logic
    // just because logging failed, but we do log it to the server console.
  }
}
