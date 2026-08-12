'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BanknoteIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  pendingBalance: number;
  eventIds: string[];
}

export function RequestPayoutButton({ pendingBalance, eventIds }: Props) {
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(false);

  async function handleRequest() {
    setLoading(true);
    try {
      const res = await fetch('/api/payouts/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit request');
      toast.success('Payout request submitted! The admin will process it within 3–5 business days.');
      setRequested(true);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (requested) {
    return (
      <div className="text-sm text-emerald-500 font-medium flex items-center gap-1.5">
        <BanknoteIcon className="w-4 h-4" /> Payout Requested ✓
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end">
      <Button
        onClick={handleRequest}
        disabled={loading}
        className="gap-2 shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <BanknoteIcon className="w-4 h-4" />
        )}
        Request Payout (Rs {(pendingBalance - 350).toLocaleString('en-PK')})
      </Button>
      <p className="text-[10px] text-muted-foreground mt-1">Includes Rs 350 processing fee</p>
    </div>
  );
}
