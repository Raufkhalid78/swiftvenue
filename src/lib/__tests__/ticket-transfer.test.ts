import { describe, it, expect } from 'vitest';

export interface AttendeeTransferState {
  id: string;
  status: 'registered' | 'attended' | 'cancelled';
  guest_name: string;
  guest_email: string;
  claim_token: string | null;
  transferred_at: string | null;
}

export function canInitiateTransfer(attendee: AttendeeTransferState): { allowed: boolean; reason?: string } {
  if (attendee.status === 'attended') {
    return { allowed: false, reason: 'Ticket has already been scanned and cannot be transferred.' };
  }
  if (attendee.status === 'cancelled') {
    return { allowed: false, reason: 'Cancelled or refunded tickets cannot be transferred.' };
  }
  return { allowed: true };
}

export function processTicketClaim(
  attendee: AttendeeTransferState,
  newGuestName: string,
  newGuestEmail: string,
  providedToken: string
): { success: boolean; updatedAttendee?: AttendeeTransferState; error?: string } {
  if (!attendee.claim_token || attendee.claim_token !== providedToken) {
    return { success: false, error: 'Invalid or expired claim link.' };
  }

  if (!newGuestName.trim() || !newGuestEmail.trim()) {
    return { success: false, error: 'Full name and email address are required.' };
  }

  const updated: AttendeeTransferState = {
    ...attendee,
    guest_name: newGuestName.trim(),
    guest_email: newGuestEmail.trim(),
    claim_token: null, // Claim token is consumed to prevent double-claiming
    transferred_at: new Date().toISOString(),
  };

  return { success: true, updatedAttendee: updated };
}

describe('Ticket Transfer & Claim Security Lifecycle', () => {
  const activeTicket: AttendeeTransferState = {
    id: 'att-123',
    status: 'registered',
    guest_name: 'Original Buyer',
    guest_email: 'buyer@example.com',
    claim_token: 'token-uuid-abc-123',
    transferred_at: null,
  };

  const usedTicket: AttendeeTransferState = {
    id: 'att-456',
    status: 'attended',
    guest_name: 'Scanned Guest',
    guest_email: 'guest@example.com',
    claim_token: null,
    transferred_at: null,
  };

  const cancelledTicket: AttendeeTransferState = {
    id: 'att-789',
    status: 'cancelled',
    guest_name: 'Refunded Guest',
    guest_email: 'refund@example.com',
    claim_token: null,
    transferred_at: null,
  };

  it('permits transfer initiation for active registered tickets', () => {
    const res = canInitiateTransfer(activeTicket);
    expect(res.allowed).toBe(true);
  });

  it('blocks transfer for tickets that have already checked in at the door', () => {
    const res = canInitiateTransfer(usedTicket);
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain('already been scanned');
  });

  it('blocks transfer for cancelled / refunded tickets', () => {
    const res = canInitiateTransfer(cancelledTicket);
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain('Cancelled or refunded');
  });

  it('successfully completes claim, updates attendee info, and invalidates claim token', () => {
    const result = processTicketClaim(
      activeTicket,
      'Sarah Connor',
      'sarah@sky.net',
      'token-uuid-abc-123'
    );

    expect(result.success).toBe(true);
    expect(result.updatedAttendee?.guest_name).toBe('Sarah Connor');
    expect(result.updatedAttendee?.guest_email).toBe('sarah@sky.net');
    expect(result.updatedAttendee?.claim_token).toBeNull();
    expect(result.updatedAttendee?.transferred_at).not.toBeNull();
  });

  it('rejects claim when token does not match or is already consumed', () => {
    const result = processTicketClaim(
      activeTicket,
      'Impostor',
      'bad@token.com',
      'wrong-token-xyz'
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid or expired claim link');
  });
});
