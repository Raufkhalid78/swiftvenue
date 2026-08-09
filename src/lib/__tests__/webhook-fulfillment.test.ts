import { describe, it, expect } from 'vitest';
import { calculateAttendeesToCreate, calculateCommission } from '../order-fulfillment';

describe('webhook fulfillment logic', () => {
  describe('calculateAttendeesToCreate', () => {
    it('creates exactly the number of attendees specified by quantity', () => {
      const order = {
        id: 'order-123',
        event_id: 'evt-123',
        guest_name: 'John Doe',
        guest_email: 'john@example.com',
        ticket_type_id: 'tt-123',
        quantity: 3,
      };
      
      const attendees = calculateAttendeesToCreate(order);
      expect(attendees).toHaveLength(3);
      expect(attendees[0].order_id).toBe('order-123');
      expect(attendees[1].guest_name).toBe('John Doe');
      expect(attendees[2].status).toBe('registered');
    });

    it('defaults to 1 attendee if quantity is undefined', () => {
      const order = {
        id: 'order-123',
        event_id: 'evt-123',
        guest_name: 'John Doe',
        guest_email: 'john@example.com',
        ticket_type_id: 'tt-123',
      };
      
      const attendees = calculateAttendeesToCreate(order);
      expect(attendees).toHaveLength(1);
    });

    it('defaults to 1 attendee if quantity is 0 or negative', () => {
      const order = {
        id: 'order-123',
        event_id: 'evt-123',
        guest_name: 'John Doe',
        guest_email: 'john@example.com',
        ticket_type_id: 'tt-123',
        quantity: -5,
      };
      
      const attendees = calculateAttendeesToCreate(order);
      expect(attendees).toHaveLength(1);
    });
  });

  describe('calculateCommission', () => {
    it('calculates the correct default 30% commission based on platform fee amount', () => {
      // 30% of 1000 is 300
      expect(calculateCommission(1000)).toBe(300);
      
      // 30% of 150 is 45
      expect(calculateCommission(150)).toBe(45);
    });

    it('returns 0 if platform fee amount is missing or falsy', () => {
      expect(calculateCommission(undefined)).toBe(0);
      expect(calculateCommission(null)).toBe(0);
      expect(calculateCommission(0)).toBe(0);
    });
  });
});
