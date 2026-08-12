export function buildAttendeeRow(guest: { name: string; email: string }, eventId: string) {
  return {
    event_id: eventId,
    guest_name: guest.name,
    guest_email: guest.email,
    source: 'bulk_import' as const,
    status: 'registered' as const,
  };
}
