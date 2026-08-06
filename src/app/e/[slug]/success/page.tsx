import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SuccessPage({ params }: { params: { slug: string } }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="bg-card border border-border max-w-md w-full rounded-2xl shadow-sm p-8 text-center animate-in zoom-in-95 duration-500 fade-in">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-emerald-500" />
        </div>
        <h1 className="font-display text-3xl font-bold mb-2">Payment Successful!</h1>
        <p className="text-muted-foreground mb-8">
          You have successfully registered for the event. We have emailed you a copy of your ticket and receipt.
        </p>
        <div className="space-y-3">
          <Link href={`/e/${params.slug}`} className="block w-full">
            <Button variant="outline" className="w-full">Return to Event Page</Button>
          </Link>
          <Link href="/" className="block w-full">
            <Button variant="ghost" className="w-full">Back to SwiftVenue</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
