import { describe, it, expect } from 'vitest';

export interface PromoRule {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_amount: number;
  applicable_ticket_type_ids?: string[] | null;
  min_quantity?: number | null;
  min_order_amount?: number | null;
}

export function evaluatePromoValidity(
  promo: PromoRule,
  ticketTypeId: string,
  quantity: number,
  orderAmount: number
): { valid: boolean; error?: string } {
  // 1. Tier restriction check
  if (
    promo.applicable_ticket_type_ids &&
    Array.isArray(promo.applicable_ticket_type_ids) &&
    promo.applicable_ticket_type_ids.length > 0
  ) {
    if (!promo.applicable_ticket_type_ids.includes(ticketTypeId)) {
      return { valid: false, error: 'This promo code is not valid for the selected ticket tier.' };
    }
  }

  // 2. Minimum quantity check
  if (promo.min_quantity && promo.min_quantity > 1) {
    if (quantity < promo.min_quantity) {
      return { valid: false, error: `This promo requires a minimum purchase of ${promo.min_quantity} tickets.` };
    }
  }

  // 3. Minimum order amount check
  if (promo.min_order_amount && promo.min_order_amount > 0) {
    if (orderAmount < promo.min_order_amount) {
      return { valid: false, error: `This promo requires a minimum order amount of PKR ${promo.min_order_amount}.` };
    }
  }

  return { valid: true };
}

describe('Advanced Promo Code Rules & Volume Constraints', () => {
  const globalPromo: PromoRule = {
    code: 'SAVE10',
    discount_type: 'percentage',
    discount_amount: 10,
    applicable_ticket_type_ids: null,
    min_quantity: null,
    min_order_amount: null,
  };

  const vipOnlyPromo: PromoRule = {
    code: 'VIPONLY',
    discount_type: 'fixed',
    discount_amount: 500,
    applicable_ticket_type_ids: ['tier-vip-123'],
    min_quantity: 1,
    min_order_amount: 0,
  };

  const groupDiscountPromo: PromoRule = {
    code: 'GROUP5',
    discount_type: 'percentage',
    discount_amount: 25,
    applicable_ticket_type_ids: null,
    min_quantity: 5,
    min_order_amount: 5000,
  };

  it('allows universal promo codes on any tier with quantity 1', () => {
    const res = evaluatePromoValidity(globalPromo, 'tier-general-999', 1, 1000);
    expect(res.valid).toBe(true);
    expect(res.error).toBeUndefined();
  });

  it('permits tier-specific promo code on the target tier', () => {
    const res = evaluatePromoValidity(vipOnlyPromo, 'tier-vip-123', 1, 5000);
    expect(res.valid).toBe(true);
  });

  it('rejects tier-specific promo code on a non-target tier', () => {
    const res = evaluatePromoValidity(vipOnlyPromo, 'tier-earlybird-456', 1, 1500);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('not valid for the selected ticket tier');
  });

  it('rejects group discount when quantity is below minimum requirement', () => {
    const res = evaluatePromoValidity(groupDiscountPromo, 'tier-general', 3, 6000);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('minimum purchase of 5 tickets');
  });

  it('rejects group discount when order total is below minimum basket requirement', () => {
    const res = evaluatePromoValidity(groupDiscountPromo, 'tier-free', 6, 3000);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('minimum order amount of PKR 5000');
  });

  it('accepts group discount when both quantity and order amount requirements are met', () => {
    const res = evaluatePromoValidity(groupDiscountPromo, 'tier-general', 5, 7500);
    expect(res.valid).toBe(true);
  });
});
