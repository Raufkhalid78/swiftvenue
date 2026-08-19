import { describe, it, expect } from 'vitest';
import {
  MIN_PAYOUT_AMOUNT,
  PAYOUT_PROCESSING_FEE,
  getDailyPayoutLimit,
  calculateRemainingDailyAllowance,
} from '@/lib/payout-limits';

describe('Payout Limits and Daily Allowance Rules', () => {
  it('returns correct tiered limits per subscription plan', () => {
    expect(getDailyPayoutLimit('free')).toBe(35000);
    expect(getDailyPayoutLimit('FREE')).toBe(35000);
    expect(getDailyPayoutLimit(null)).toBe(35000);
    expect(getDailyPayoutLimit('pro')).toBe(100000);
    expect(getDailyPayoutLimit('enterprise')).toBe(500000);
  });

  it('calculates full daily allowance when user has zero recent payouts', () => {
    const result = calculateRemainingDailyAllowance([], 'free');
    expect(result.dailyLimit).toBe(35000);
    expect(result.usedInLast24h).toBe(0);
    expect(result.remainingToday).toBe(35000);
    expect(result.minAmount).toBe(MIN_PAYOUT_AMOUNT);
    expect(result.fee).toBe(PAYOUT_PROCESSING_FEE);
  });

  it('correctly reduces remaining allowance after partial withdrawal', () => {
    const recentPayouts = [
      { amount: 15000, status: 'paid' },
      { amount: 5000, status: 'pending' },
    ];
    const result = calculateRemainingDailyAllowance(recentPayouts, 'free');
    expect(result.usedInLast24h).toBe(20000);
    expect(result.remainingToday).toBe(15000); // 35,000 - 20,000
  });

  it('caps remaining allowance at zero when limit is reached or exceeded', () => {
    const recentPayouts = [
      { amount: 35000, status: 'paid' },
    ];
    const result = calculateRemainingDailyAllowance(recentPayouts, 'free');
    expect(result.usedInLast24h).toBe(35000);
    expect(result.remainingToday).toBe(0);
  });

  it('ignores rejected or failed payouts when summing 24h usage', () => {
    const recentPayouts = [
      { amount: 20000, status: 'paid' },
      { amount: 10000, status: 'failed' },
      { amount: 5000, status: 'cancelled' },
    ];
    const result = calculateRemainingDailyAllowance(recentPayouts, 'free');
    expect(result.usedInLast24h).toBe(20000);
    expect(result.remainingToday).toBe(15000);
  });

  it('scales correctly for Pro plan users', () => {
    const recentPayouts = [
      { amount: 40000, status: 'paid' },
    ];
    const result = calculateRemainingDailyAllowance(recentPayouts, 'pro');
    expect(result.dailyLimit).toBe(100000);
    expect(result.usedInLast24h).toBe(40000);
    expect(result.remainingToday).toBe(60000);
  });
});
