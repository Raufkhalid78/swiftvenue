'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { BanknoteIcon, Loader2, Info, ArrowRight, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { MIN_PAYOUT_AMOUNT, PAYOUT_PROCESSING_FEE } from '@/lib/payout-limits';

interface Props {
  pendingBalance: number;
  eventIds: string[];
  dailyLimit: number;
  remainingDailyAllowance: number;
  usedInLast24h: number;
  hasPendingPayout?: boolean;
}

export function RequestPayoutButton({
  pendingBalance,
  eventIds,
  dailyLimit,
  remainingDailyAllowance,
  usedInLast24h,
  hasPendingPayout = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const maxAvailableToday = Math.min(pendingBalance, remainingDailyAllowance);
  const [requestedAmount, setRequestedAmount] = useState<number>(maxAvailableToday);
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(hasPendingPayout);

  const numericAmount = Number(requestedAmount) || 0;
  const isBelowMin = numericAmount < MIN_PAYOUT_AMOUNT;
  const exceedsBalance = numericAmount > pendingBalance;
  const exceedsDaily = numericAmount > remainingDailyAllowance;
  const isValid = !isBelowMin && !exceedsBalance && !exceedsDaily && numericAmount > 0;

  const netDisbursement = Math.max(0, numericAmount - PAYOUT_PROCESSING_FEE);

  async function handleRequest() {
    if (!isValid) return;
    setLoading(true);
    try {
      const res = await fetch('/api/payouts/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventIds,
          amount: numericAmount,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit payout request');
      
      toast.success('Payout request submitted! The finance team will process it within 3–5 business days.');
      setRequested(true);
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (requested) {
    return (
      <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
        <ShieldCheck className="w-4 h-4" /> Payout Under Review ✓
      </div>
    );
  }

  const isDailyLimitCapped = remainingDailyAllowance < MIN_PAYOUT_AMOUNT;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="flex flex-col items-end">
          <Button
            disabled={isDailyLimitCapped || pendingBalance < MIN_PAYOUT_AMOUNT}
            className="gap-2 shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            <BanknoteIcon className="w-4 h-4" />
            Request Payout
          </Button>
          <p className="text-[10px] text-muted-foreground mt-1">
            Max Rs {dailyLimit.toLocaleString()} / day
          </p>
        </div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BanknoteIcon className="w-5 h-5 text-emerald-600" />
            Request Organizer Payout
          </DialogTitle>
          <DialogDescription>
            Withdraw your event ticket earnings directly to your registered bank account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Balance & Daily Limit Overview Cards */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-muted/40 rounded-xl border border-border text-sm">
            <div>
              <span className="text-xs text-muted-foreground block">Available Balance</span>
              <span className="font-bold text-base text-foreground">Rs {pendingBalance.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Available Today</span>
              <span className="font-bold text-base text-emerald-600 dark:text-emerald-400">
                Rs {remainingDailyAllowance.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Daily Limit Notice */}
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-primary/5 p-3 rounded-lg border border-primary/10">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p>
              Daily payout limit: <strong className="text-foreground">Rs {dailyLimit.toLocaleString()}</strong> per 24 hours. 
              {usedInLast24h > 0 && ` (You've withdrawn Rs ${usedInLast24h.toLocaleString()} in the last 24h).`}
            </p>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="payout-amount">Withdrawal Amount (PKR)</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-primary font-semibold hover:bg-primary/10 px-2"
                onClick={() => setRequestedAmount(maxAvailableToday)}
              >
                Max Today (Rs {maxAvailableToday.toLocaleString()})
              </Button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground text-sm font-semibold">Rs</span>
              <Input
                id="payout-amount"
                type="number"
                min={MIN_PAYOUT_AMOUNT}
                max={maxAvailableToday}
                step={500}
                value={requestedAmount}
                onChange={(e) => setRequestedAmount(Number(e.target.value))}
                className="pl-10 text-base font-semibold"
              />
            </div>
            {isBelowMin && (
              <p className="text-xs text-destructive">Minimum payout request is Rs {MIN_PAYOUT_AMOUNT.toLocaleString()}</p>
            )}
            {exceedsDaily && (
              <p className="text-xs text-destructive">Amount exceeds your remaining daily allowance (Rs {remainingDailyAllowance.toLocaleString()})</p>
            )}
            {exceedsBalance && !exceedsDaily && (
              <p className="text-xs text-destructive">Amount exceeds your total available balance</p>
            )}
          </div>

          {/* Breakdown Summary */}
          <div className="p-3 bg-muted/20 rounded-xl border border-border space-y-1.5 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Gross Withdrawal</span>
              <span>Rs {numericAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>IBFT Processing Fee</span>
              <span>- Rs {PAYOUT_PROCESSING_FEE.toLocaleString()}</span>
            </div>
            <div className="pt-1.5 border-t border-border flex justify-between font-bold text-sm text-foreground">
              <span>Net Wire to Bank</span>
              <span className="text-emerald-600 dark:text-emerald-400">
                Rs {netDisbursement.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleRequest}
            disabled={!isValid || loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            Confirm & Request Payout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

