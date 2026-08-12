import { describe, it, expect } from 'vitest';
import { getOrderAttendees } from '@/lib/get-order-attendees';
import { mockOrderWithAttendees } from './mock-supabase';

describe('getOrderAttendees', () => {
  it('returns one attendee record for a single-ticket order', async () => {
    const mockSupabase = mockOrderWithAttendees({ orderId: 'order-1', attendeeCount: 1 });
    const { attendees } = await getOrderAttendees(mockSupabase, 'order-1');
    expect(attendees).toHaveLength(1);
  });

  it('returns all N distinct attendee records for a multi-ticket order, each with a unique id', async () => {
    const mockSupabase = mockOrderWithAttendees({ orderId: 'order-2', attendeeCount: 5 });
    const { attendees } = await getOrderAttendees(mockSupabase, 'order-2');
    expect(attendees).toHaveLength(5);
    const uniqueIds = new Set(attendees.map((a: any) => a.id));
    expect(uniqueIds.size).toBe(5); // regression test directly targeting the bug just fixed
  });

  it('throws a clear error when the order has no attendees', async () => {
    const mockSupabase = mockOrderWithAttendees({ orderId: 'order-3', attendeeCount: 0 });
    await expect(getOrderAttendees(mockSupabase, 'order-3')).rejects.toThrow('No attendees found for this order');
  });
});
