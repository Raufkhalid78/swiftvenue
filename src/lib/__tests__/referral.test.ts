import { describe, it, expect } from 'vitest';
import { createReferralCode } from '@/lib/referral';
import { mockInsertSuccess, mockInsertAlwaysFails } from './mock-supabase';

describe('createReferralCode', () => {
  it('generates a valid code when no collision occurs', async () => {
    const mockSupabase = mockInsertSuccess();
    const code = await createReferralCode(mockSupabase, 'event-1', 'Jane Doe', 'attendee-1');
    expect(code).toBe('mock-code');
  });

  it('returns null on insert failure (e.g., unique-constraint collision)', async () => {
    const mockSupabase = mockInsertAlwaysFails({ errorCode: '23505' });
    const code = await createReferralCode(mockSupabase, 'event-1', 'Jane Doe', 'attendee-1');
    expect(code).toBeNull();
  });
});
