import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, Calendar } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full space-y-8">
        <div className="flex justify-center">
          <div className="relative w-20 h-20 mb-4 rounded-xl shadow-lg border border-border/50 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/logo.jpg" 
              alt="SwiftVenue Logo"
              className="absolute inset-0 w-full h-full object-cover" 
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-6xl md:text-8xl font-display font-bold text-primary drop-shadow-sm">
            404
          </h1>
          <h2 className="text-2xl md:text-3xl font-display font-semibold text-foreground mt-4">
            Page Not Found
          </h2>
          <p className="text-muted-foreground font-sans max-w-sm mx-auto">
            The page you are looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Button
            asChild
            variant="default"
            className="gap-2"
          >
            <Link href="/">
              <Home className="h-4 w-4" />
              Return Home
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="gap-2"
          >
            <Link href="/dashboard">
              <Calendar className="h-4 w-4" />
              Go to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
