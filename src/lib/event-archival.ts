import { SupabaseClient } from '@supabase/supabase-js';

export const EVENT_ARCHIVE_THRESHOLD_DAYS = 180; // ~6 months

/**
 * Calculates the ISO date string (YYYY-MM-DD) cutoff for events that occurred
 * more than the specified number of months / days ago.
 */
export function getArchivalCutoffDate(months: number = 6, referenceDate: Date = new Date()): string {
  const cutoff = new Date(referenceDate);
  cutoff.setMonth(cutoff.getMonth() - months);
  return cutoff.toISOString().split('T')[0];
}

/**
 * Checks if a specific event date is older than the 6-month archival threshold.
 */
export function isEventEligibleForArchival(
  eventDateStr: string,
  referenceDate: Date = new Date(),
  months: number = 6
): boolean {
  if (!eventDateStr) return false;
  const eventDate = new Date(eventDateStr);
  if (isNaN(eventDate.getTime())) return false;

  const cutoff = new Date(referenceDate);
  cutoff.setMonth(cutoff.getMonth() - months);
  
  // Normalize to date string comparison (YYYY-MM-DD)
  const eventDateFormatted = eventDate.toISOString().split('T')[0];
  const cutoffFormatted = cutoff.toISOString().split('T')[0];
  
  return eventDateFormatted < cutoffFormatted;
}

/**
 * Automatically archives events that concluded over 6 months ago.
 * Preserves all financial orders, attendee records, and payout transactions.
 * Purges ephemeral waitlists and temporary lock states.
 */
export async function archiveConcludedEvents(
  service: SupabaseClient,
  referenceDate: Date = new Date()
): Promise<{ archivedCount: number; error?: string }> {
  try {
    const cutoffDateStr = getArchivalCutoffDate(6, referenceDate);

    // 1. Fetch published events older than 6 months
    const { data: eligibleEvents, error: fetchErr } = await service
      .from('events')
      .select('id')
      .eq('status', 'published')
      .lt('date', cutoffDateStr);

    if (fetchErr) throw fetchErr;
    if (!eligibleEvents || eligibleEvents.length === 0) {
      return { archivedCount: 0 };
    }

    const eventIds = eligibleEvents.map(e => e.id);
    const nowIso = new Date().toISOString();

    // 2. Batch update status to 'archived' and set archived_at timestamp
    const { error: updateErr } = await service
      .from('events')
      .update({
        status: 'archived',
        archived_at: nowIso,
        updated_at: nowIso
      })
      .in('id', eventIds);

    if (updateErr) throw updateErr;

    // 3. Purge ephemeral waitlist entries for archived events
    await service
      .from('waitlists')
      .delete()
      .in('event_id', eventIds);

    return { archivedCount: eventIds.length };
  } catch (error: any) {
    console.error('Failed to archive concluded events:', error);
    return { archivedCount: 0, error: error.message };
  }
}
