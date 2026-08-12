import { describe, it, expect } from 'vitest';
import { buildAttendeeRow } from '@/lib/guest-import';

describe('bulk guest import row shape', () => {
  it('only includes columns that actually exist on the attendees table', () => {
    const guest = { name: 'Jane Doe', email: 'jane@example.com' };
    const row = buildAttendeeRow(guest, 'event-1');

    const validColumns = [
      'event_id', 'guest_name', 'guest_email', 'guest_phone',
      'source', 'status', 'ticket_type_id', 'order_id'
    ]; 

    Object.keys(row).forEach((key) => {
      expect(validColumns).toContain(key);
    });
  });

  it('omits order_id rather than fabricating one', () => {
    const row = buildAttendeeRow({ name: 'Jane Doe', email: 'jane@example.com' }, 'event-1');
    expect((row as any).order_id).toBeUndefined();
  });

  it('sets source to bulk_import', () => {
    const row = buildAttendeeRow({ name: 'Jane Doe', email: 'jane@example.com' }, 'event-1');
    expect(row.source).toBe('bulk_import');
  });
});
