"use client";

import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export function WalletButtons({ orderId }: { orderId: string }) {
  const [loadingApp, setLoadingApp] = useState(false);
  const [loadingGoog, setLoadingGoog] = useState(false);

  const handleWallet = async (type: 'apple' | 'google') => {
    if (type === 'apple') setLoadingApp(true);
    else setLoadingGoog(true);

    try {
      if (type === 'apple') {
        const res = await fetch(`/api/wallet/apple?orderId=${orderId}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to generate Apple Wallet pass');
        }
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ticket-${orderId}.pkpass`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const res = await fetch(`/api/wallet/google?orderId=${orderId}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to generate Google Wallet link');
        }
        const data = await res.json();
        if (data.url) {
          window.open(data.url, '_blank');
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to add to wallet');
    } finally {
      if (type === 'apple') setLoadingApp(false);
      else setLoadingGoog(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 mt-4">
      <Button 
        variant="outline" 
        className="w-full bg-black text-white hover:bg-zinc-800 border-black"
        onClick={() => handleWallet('apple')}
        disabled={loadingApp}
      >
        <Wallet className="w-4 h-4 mr-2" /> 
        {loadingApp ? "Adding..." : "Add to Apple Wallet"}
      </Button>
      <Button 
        variant="outline" 
        className="w-full bg-white text-black hover:bg-zinc-100 border-zinc-300"
        onClick={() => handleWallet('google')}
        disabled={loadingGoog}
      >
        <Wallet className="w-4 h-4 mr-2" /> 
        {loadingGoog ? "Adding..." : "Add to Google Wallet"}
      </Button>
    </div>
  );
}
