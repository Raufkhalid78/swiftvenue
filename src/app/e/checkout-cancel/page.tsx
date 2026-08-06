import Link from "next/link";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
      <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-6 mx-auto">
        <XCircle className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-bold font-display mb-4">Checkout Cancelled</h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        Your ticket purchase was not completed. You have not been charged.
      </p>
      <Link href="/">
        <Button variant="outline">Return to Homepage</Button>
      </Link>
    </div>
  );
}
