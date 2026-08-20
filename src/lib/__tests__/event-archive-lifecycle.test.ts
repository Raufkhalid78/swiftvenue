import { describe, it, expect, vi } from 'vitest';
import { getArchivalCutoffDate, isEventEligibleForArchival, archiveConcludedEvents } from '../event-archival';

describe('Event Archival Lifecycle Rules', () => {
  it('correctly calculates the 6-month cutoff date', () => {
    const fixedNow = new Date('2026-08-20T12:00:00Z');
    const cutoff = getArchivalCutoffDate(6, fixedNow);
    // 6 months before August 2026 is February 2026
    expect(cutoff).toBe('2026-02-20');
  });

  it('marks events older than 6 months as eligible for archival', () => {
    const fixedNow = new Date('2026-08-20T12:00:00Z');
    
    // 7 months ago
    expect(isEventEligibleForArchival('2026-01-15', fixedNow)).toBe(true);
    // 1 year ago
    expect(isEventEligibleForArchival('2025-08-01', fixedNow)).toBe(true);
  });

  it('does NOT mark recent or future events as eligible for archival', () => {
    const fixedNow = new Date('2026-08-20T12:00:00Z');
    
    // 2 months ago
    expect(isEventEligibleForArchival('2026-06-15', fixedNow)).toBe(false);
    // Yesterday
    expect(isEventEligibleForArchival('2026-08-19', fixedNow)).toBe(false);
    // Future event (Islamabad Summit 2027)
    expect(isEventEligibleForArchival('2027-01-07', fixedNow)).toBe(false);
  });

  it('handles invalid date strings gracefully', () => {
    expect(isEventEligibleForArchival('')).toBe(false);
    expect(isEventEligibleForArchival('not-a-date')).toBe(false);
  });

  it('executes batch update to archived and purges waitlists while retaining orders', async () => {
    const mockEvents = [{ id: 'evt-1' }, { id: 'evt-2' }];

    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        lt: vi.fn().mockResolvedValue({ data: mockEvents, error: null })
      })
    });

    const mockUpdate = vi.fn().mockReturnValue({
      in: vi.fn().mockResolvedValue({ error: null })
    });

    const mockDelete = vi.fn().mockReturnValue({
      in: vi.fn().mockResolvedValue({ error: null })
    });

    const mockService: any = {
      from: vi.fn((table: string) => {
        if (table === 'events') {
          return {
            select: mockSelect,
            update: mockUpdate
          };
        }
        if (table === 'waitlists') {
          return {
            delete: mockDelete
          };
        }
        return {};
      })
    };

    const res = await archiveConcludedEvents(mockService, new Date('2026-08-20T12:00:00Z'));

    expect(res.archivedCount).toBe(2);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'archived'
      })
    );
    expect(mockDelete).toHaveBeenCalled();
  });
});
