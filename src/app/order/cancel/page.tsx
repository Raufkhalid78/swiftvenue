"use client";

import { useRouter } from "next/navigation";
import { XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OrderCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full space-y-6 p-8 rounded-2xl border border-destructive/20 bg-destructive/5 flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <XCircle className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-display font-bold text-foreground">
          Checkout Cancelled
        </h1>
        <p className="text-muted-foreground text-sm">
          You cancelled the checkout process. No charges were made to your account.
        </p>
        <Button 
          onClick={() => router.push("/?step=payment")} 
          className="mt-4 gap-2 bg-gold hover:bg-gold-light text-emerald-dark"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Checkout
        </Button>
      </div>
    </div>
  );
}
