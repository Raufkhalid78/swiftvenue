export const DAILY_PAYOUT_LIMITS: Record<string, number> = {
  free: 35000,
  pro: 100000,
  enterprise: 500000,
};

export const MIN_PAYOUT_AMOUNT = 5000;
export const PAYOUT_PROCESSING_FEE = 350;

/**
 * Returns the daily maximum withdrawal limit based on organizer's subscription plan.
 */
export function getDailyPayoutLimit(plan?: string | null): number {
  const normalizedPlan = (plan || 'free').toLowerCase();
  return DAILY_PAYOUT_LIMITS[normalizedPlan] ?? DAILY_PAYOUT_LIMITS.free;
}

export interface PayoutRecord {
  amount: number;
  status: string;
  created_at?: string;
}

export interface PayoutAllowanceResult {
  dailyLimit: number;
  usedInLast24h: number;
  remainingToday: number;
  minAmount: number;
  fee: number;
}

/**
 * Calculates remaining withdrawal allowance within a rolling 24-hour window.
 */
export function calculateRemainingDailyAllowance(
  recentPayouts: PayoutRecord[],
  plan?: string | null
): PayoutAllowanceResult {
  const dailyLimit = getDailyPayoutLimit(plan);

  // Sum payouts in pending, processing, or paid status
  const usedInLast24h = (recentPayouts || [])
    .filter(p => p.status === 'pending' || p.status === 'processing' || p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const remainingToday = Math.max(0, dailyLimit - usedInLast24h);

  return {
    dailyLimit,
    usedInLast24h,
    remainingToday,
    minAmount: MIN_PAYOUT_AMOUNT,
    fee: PAYOUT_PROCESSING_FEE,
  };
}
