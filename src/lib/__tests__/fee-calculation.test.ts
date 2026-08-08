import { describe, it, expect } from 'vitest';
import { calculatePlatformFee } from '@/lib/fees';

describe('calculatePlatformFee', () => {
  it('applies free-tier rate correctly', () => {
    expect(calculatePlatformFee(1000, 1, { fee_percent: 7, fee_fixed: 30 })).toBe(100); // 70 + 30
  });
  it('applies pro-tier rate correctly', () => {
    expect(calculatePlatformFee(1000, 1, { fee_percent: 3, fee_fixed: 15 })).toBe(45); // 30 + 15
  });
  it('scales fixed fee with quantity', () => {
    expect(calculatePlatformFee(2000, 2, { fee_percent: 7, fee_fixed: 30 })).toBe(200); // 140 + 60
  });
  it('returns zero fee for free tickets', () => {
    expect(calculatePlatformFee(0, 1, { fee_percent: 7, fee_fixed: 30 })).toBe(0);
  });
});
