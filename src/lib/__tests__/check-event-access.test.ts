import { describe, it, expect } from 'vitest';
import { checkEventAccess } from '@/lib/team';
import { mockSupabaseEvent, mockSupabaseEventWithCollaborator } from './mock-supabase';

describe('checkEventAccess', () => {
  it('grants the owner access when owner role is in requiredRoles', async () => {
    const mockService = mockSupabaseEvent({ user_id: 'owner-1' });
    const result = await checkEventAccess(mockService, 'event-1', 'owner-1', ['owner', 'coorganizer']);
    expect(result).toBe(true);
  });

  it('DENIES the owner when owner role is NOT in requiredRoles — documents a real edge case found in an earlier review', async () => {
    const mockService = mockSupabaseEvent({ user_id: 'owner-1' });
    const result = await checkEventAccess(mockService, 'event-1', 'owner-1', ['coorganizer']); // deliberately excludes 'owner'
    expect(result).toBe(false); // this is the current, documented behavior — every call site must remember to include 'owner'
  });

  it('grants a coorganizer collaborator access when their role matches', async () => {
    const mockService = mockSupabaseEventWithCollaborator({ eventOwner: 'owner-1', collaboratorId: 'collab-1', role: 'coorganizer' });
    const result = await checkEventAccess(mockService, 'event-1', 'collab-1', ['owner', 'coorganizer']);
    expect(result).toBe(true);
  });

  it('denies checkin_staff access to a coorganizer-only action', async () => {
    const mockService = mockSupabaseEventWithCollaborator({ eventOwner: 'owner-1', collaboratorId: 'staff-1', role: 'checkin_staff' });
    const result = await checkEventAccess(mockService, 'event-1', 'staff-1', ['owner', 'coorganizer']);
    expect(result).toBe(false);
  });

  it('denies access to a user with no relationship to the event', async () => {
    const mockService = mockSupabaseEvent({ user_id: 'owner-1' });
    const result = await checkEventAccess(mockService, 'event-1', 'random-user', ['owner', 'coorganizer', 'checkin_staff']);
    expect(result).toBe(false);
  });
});
