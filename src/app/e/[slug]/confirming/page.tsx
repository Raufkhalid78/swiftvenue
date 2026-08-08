'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function ConfirmingPaymentPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order');
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      router.replace(`/e/${params.slug}`);
      return;
    }

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/payment/status?order=${orderId}`);
        if (!res.ok) throw new Error('Failed to fetch status');
        
        const data = await res.json();
        
        if (data.status === 'paid') {
          router.replace(`/e/${params.slug}/success?order=${orderId}`);
          return;
        } else if (data.status === 'failed') {
          router.replace(`/e/${params.slug}?paymentError=Payment failed`);
          return;
        }
        
        // Still pending
        if (attempts > 20) {
          setError("This is taking longer than expected. Please check your email or contact support if your payment was deducted.");
        } else {
          setAttempts(a => a + 1);
          setTimeout(checkStatus, 2000);
        }
      } catch (err) {
        console.error(err);
        setAttempts(a => a + 1);
        setTimeout(checkStatus, 2000);
      }
    };

    const timer = setTimeout(checkStatus, 2000);
    return () => clearTimeout(timer);
  }, [orderId, params.slug, router, attempts]);

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card border border-border shadow-lg rounded-3xl p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-2">Confirming Payment</h1>
          <p className="text-muted-foreground">
            {error || "Please wait while we verify your payment with Safepay. This usually takes just a few seconds."}
          </p>
        </div>
      </div>
    </div>
  );
}
