import { describe, it, expect, vi } from 'vitest';
import { checkGuestLimit } from '../plans';
import { NextResponse } from 'next/server';

// Mock NextResponse
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn().mockImplementation((body, init) => ({ body, init }))
  }
}));

describe('checkGuestLimit', () => {
  const createMockService = (currentAttendees: number | null, maxGuests: number | null, countErr: any = null, planErr: any = null) => {
    return {
      from: vi.fn().mockImplementation((table) => {
        if (table === 'attendees') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ count: currentAttendees, error: countErr })
          };
        }
        if (table === 'plans') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { max_guests_per_event: maxGuests }, error: planErr })
          };
        }
        return {};
      })
    } as any;
  };

  it('allows a purchase that stays within the limit', async () => {
    const mockService = createMockService(95, 100);
    const result = await checkGuestLimit(mockService, 'event-1', 'free', 3);
    expect(result).toBeNull();
  });

  it('allows a purchase exactly at the limit', async () => {
    const mockService = createMockService(95, 100);
    const result = await checkGuestLimit(mockService, 'event-1', 'free', 5);
    expect(result).toBeNull();
  });

  it('blocks a purchase that would exceed the limit', async () => {
    const mockService = createMockService(95, 100);
    const result = await checkGuestLimit(mockService, 'event-1', 'free', 10);
    expect(result).not.toBeNull();
    const typedResult = result as any;
    expect(typedResult.init.status).toBe(403);
    expect(typedResult.body.error).toContain('Only 5 guest spot(s) remaining');
  });

  it('blocks a purchase when limit is already reached', async () => {
    const mockService = createMockService(100, 100);
    const result = await checkGuestLimit(mockService, 'event-1', 'free', 1);
    expect(result).not.toBeNull();
    const typedResult = result as any;
    expect(typedResult.init.status).toBe(403);
    expect(typedResult.body.error).toContain('This event has reached its guest limit');
  });

  it('allows unlimited quantity on a plan with no cap', async () => {
    const mockService = createMockService(500, null);
    const result = await checkGuestLimit(mockService, 'event-1', 'enterprise', 100);
    expect(result).toBeNull();
  });

  it('handles database errors gracefully (attendee count error)', async () => {
    const mockService = createMockService(null, null, new Error('DB Error'));
    const result = await checkGuestLimit(mockService, 'event-1', 'free', 1);
    expect(result).not.toBeNull();
    const typedResult = result as any;
    expect(typedResult.init.status).toBe(500);
  });

  it('handles database errors gracefully (plan fetch error)', async () => {
    const mockService = createMockService(0, null, null, new Error('DB Error'));
    const result = await checkGuestLimit(mockService, 'event-1', 'free', 1);
    expect(result).not.toBeNull();
    const typedResult = result as any;
    expect(typedResult.init.status).toBe(500);
  });
});
