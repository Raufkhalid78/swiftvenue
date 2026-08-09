import { SupabaseClient } from '@supabase/supabase-js';

export type TeamRole = 'owner' | 'coorganizer' | 'checkin_staff';

export async function checkEventAccess(
  service: SupabaseClient,
  eventId: string,
  userId: string,
  requiredRoles: TeamRole[]
): Promise<boolean> {
  // 1. Check if user is the owner
  const { data: event } = await service
    .from('events')
    .select('user_id')
    .eq('id', eventId)
    .single();

  if (!event) return false;

  if (event.user_id === userId) {
    return requiredRoles.includes('owner');
  }

  // 2. Check if user is a collaborator with one of the required roles
  const { data: collaborator } = await service
    .from('event_collaborators')
    .select('role')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .single();

  if (!collaborator) return false;

  return requiredRoles.includes(collaborator.role as TeamRole);
}
