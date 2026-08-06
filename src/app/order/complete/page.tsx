"use client";

import { useEffect, useState, Suspense, type ReactNode } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Status = "checking" | "paid" | "failed" | "timeout" | "invalid";

function StatusScreen({ icon, title, message, action }: { icon: ReactNode; title: string; message: string; action?: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full space-y-6 p-8 rounded-2xl border border-gold/30 bg-gold/5 flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-emerald/20 flex items-center justify-center">{icon}</div>
        <h1 className="text-2xl font-display font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground text-sm">{message}</p>
        {action}
      </div>
    </div>
  );
}

function OrderCompleteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tracker = searchParams.get("tracker");
  const [status, setStatus] = useState<Status>("checking");
  const [invitationId, setInvitationId] = useState<string | null>(null);

  useEffect(() => {
    if (!tracker) {
      setStatus("invalid");
      return;
    }
    let attempts = 0;
    const maxAttempts = 15; // ~30s total at 2s intervals
    let cancelled = false;

    const poll = async () => {
      attempts += 1;
      try {
        const res = await fetch(`/api/payment/status?tracker=${encodeURIComponent(tracker)}`);
        if (res.ok) {
          const data = await res.json();
          if (cancelled) return;
          if (data.status === "paid") { setInvitationId(data.invitationId); setStatus("paid"); return; }
          if (data.status === "failed") { setStatus("failed"); return; }
        }
      } catch (e) {
        console.error("Status poll failed:", e);
      }
      if (attempts >= maxAttempts) { if (!cancelled) setStatus("timeout"); return; }
      setTimeout(poll, 2000);
    };
    poll();
    return () => { cancelled = true; };
  }, [tracker]);

  useEffect(() => {
    if (status === "paid") {
      const t = setTimeout(() => {
        router.push(`/?step=success${invitationId ? `&invitationId=${invitationId}` : ""}`);
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [status, invitationId, router]);

  if (status === "invalid") {
    return <StatusScreen icon={<XCircle className="w-8 h-8 text-destructive" />} title="Invalid Request" message="We couldn't verify this payment session." action={<Button onClick={() => router.push("/")} className="mt-4 bg-gold hover:bg-gold-light text-emerald-dark">Return Home</Button>} />;
  }
  if (status === "failed") {
    return <StatusScreen icon={<XCircle className="w-8 h-8 text-destructive" />} title="Payment Failed" message="Your payment could not be completed. Please try again from your dashboard." action={<Button onClick={() => router.push("/dashboard")} className="mt-4 bg-gold hover:bg-gold-light text-emerald-dark">Back to Dashboard</Button>} />;
  }
  if (status === "timeout") {
    return <StatusScreen icon={<Loader2 className="w-8 h-8 text-gold" />} title="Still Processing" message="This is taking longer than expected. Refresh in a minute, or contact support if it persists." action={<Button onClick={() => window.location.reload()} className="mt-4 bg-gold hover:bg-gold-light text-emerald-dark">Refresh</Button>} />;
  }
  return (
    <StatusScreen
      icon={status === "paid" ? <CheckCircle2 className="w-8 h-8 text-emerald" /> : <Loader2 className="w-6 h-6 animate-spin text-gold" />}
      title={status === "paid" ? "Payment Received!" : "Verifying Payment..."}
      message="Please wait while we confirm your payment and activate your invitation."
    />
  );
}

export default function OrderCompletePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gold" /></div>}>
      <OrderCompleteContent />
    </Suspense>
  );
}