export function calculatePlatformFee(
  amount: number,
  quantity: number,
  planConfig: { fee_percent?: number | null; fee_fixed?: number | null } | null
): number {
  if (amount <= 0) {
    return 0;
  }

  const percent = Number(planConfig?.fee_percent ?? 7);
  const fixed = Number(planConfig?.fee_fixed ?? 30);

  const fee = (amount * (percent / 100)) + (fixed * quantity);
  return fee;
}
