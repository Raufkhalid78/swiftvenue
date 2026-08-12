import { vi } from 'vitest';

export function mockSupabaseEvent({ user_id }: { user_id: string }) {
  const eqMock = vi.fn().mockImplementation(() => ({
    eq: eqMock,
    single: vi.fn().mockResolvedValue({ data: { user_id } }),
  }));
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: eqMock,
      }),
    }),
  } as any;
}

export function mockSupabaseEventWithCollaborator({ eventOwner, collaboratorId: _collaboratorId, role }: { eventOwner: string, collaboratorId: string, role: string }) {
  return {
    from: vi.fn((table: string) => {
      if (table === 'events') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockImplementation(() => ({
              eq: vi.fn().mockImplementation((_col2: string, _collaboratorId: string) => ({
                single: vi.fn().mockResolvedValue({ data: { user_id: eventOwner } }),
              })),
              single: vi.fn().mockResolvedValue({ data: { user_id: eventOwner } }),
            })),
          }),
        };
      }
      if (table === 'event_collaborators') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { role } }),
              }),
            }),
          }),
        };
      }
      return {};
    }),
  } as any;
}

export function mockInsertSuccess() {
  return {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { code: 'mock-code' }, error: null }),
        }),
      }),
    }),
    insertCallCount: 0,
  } as any;
}

export function mockInsertFailsThenSucceeds({ failCount, errorCode }: { failCount: number, errorCode: string }) {
  let calls = 0;
  return {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockImplementation(() => {
        calls++;
        if (calls <= failCount) {
          return {
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { code: errorCode } }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { code: 'mock-code' }, error: null }),
          }),
        };
      }),
    }),
    get insertCallCount() { return calls; }
  } as any;
}

export function mockInsertAlwaysFails({ errorCode }: { errorCode: string }) {
  let calls = 0;
  return {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockImplementation(() => {
        calls++;
        return {
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: errorCode } }),
          }),
        };
      }),
    }),
    get insertCallCount() { return calls; }
  } as any;
}

export function mockOrderWithAttendees({ orderId, attendeeCount }: { orderId: string, attendeeCount: number }) {
  return {
    from: vi.fn((table: string) => {
      if (table === 'orders') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: orderId, event_id: 'event-1' }, error: null }),
            }),
          }),
        };
      }
      if (table === 'events') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: 'event-1' }, error: null }),
            }),
          }),
        };
      }
      if (table === 'attendees') {
        const attendees = Array.from({ length: attendeeCount }).map((_, i) => ({
          id: `attendee-${i}`,
          order_id: orderId,
        }));
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: attendees, error: null }),
            }),
          }),
        };
      }
      return {};
    }),
  } as any;
}
