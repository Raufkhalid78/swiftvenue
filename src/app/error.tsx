"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled Application Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full space-y-8">
        <div className="flex justify-center">
          <div className="relative w-24 h-24 mb-4">
            <Image 
              src="/logo.svg" 
              alt="SwiftVenue Logo"
              fill
              className="object-contain drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]" 
              priority
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
            Something went wrong
          </h1>
          <p className="text-muted-foreground font-sans">
            We apologize for the inconvenience. An unexpected error has occurred while processing your request.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Button
            onClick={() => reset()}
            variant="default"
            className="gap-2 bg-emerald hover:bg-emerald-dark"
          >
            <RotateCcw className="h-4 w-4" />
            Try Again
          </Button>
          <Button
            asChild
            variant="outline"
            className="gap-2 border-gold/30 hover:bg-gold/10"
          >
            <a href="/">
              <Home className="h-4 w-4" />
              Return Home
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
