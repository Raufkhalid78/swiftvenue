"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function QueueContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // In a real production queue, this would establish a WebSocket connection 
    // to track queue position. For this implementation, we simulate a queue wait time.
    const waitTime = Math.floor(Math.random() * 5000) + 5000; // 5-10 seconds
    
    const timer = setTimeout(() => {
      // Set the clearance cookie so middleware lets us through for the next hour
      document.cookie = "swiftvenue_queue_cleared=true; path=/; max-age=3600";
      
      const target = searchParams.get('target') || '/';
      router.push(target);
    }, waitTime);

    return () => clearTimeout(timer);
  }, [router, searchParams]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground p-6">
      <div className="max-w-md w-full bg-card border border-border p-8 rounded-3xl shadow-xl text-center space-y-6 relative overflow-hidden">
        {/* Loading spinner */}
        <div className="w-16 h-16 mx-auto bg-primary/10 text-primary rounded-full flex items-center justify-center relative z-10">
          <svg className="w-8 h-8 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </div>
        
        <div className="relative z-10">
          <h2 className="text-2xl font-bold font-display">You are in line</h2>
          <p className="text-muted-foreground mt-2">
            We are experiencing high traffic right now. You have been placed in a virtual queue to ensure everyone has a fair chance to purchase tickets.
          </p>
        </div>
        
        <div className="pt-6 border-t border-border text-sm text-muted-foreground relative z-10">
          <p>Please do not refresh this page. You will be automatically redirected when it's your turn.</p>
        </div>
      </div>
    </div>
  );
}

export default function QueuePage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading...</div>}>
      <QueueContent />
    </Suspense>
  );
}
