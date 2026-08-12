"use client";

import React, { useState, use } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function SponsorScannerPage({ params }: { params: Promise<{ sponsorId: string }> }) {
  const resolvedParams = use(params);
  const [loading, setLoading] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    guestName?: string;
    ticketType?: string;
  } | null>(null);

  const handleScan = async (result: any) => {
    if (!result || !result[0]) return;
    
    const qrData = result[0].rawValue;
    if (qrData === lastScanned || loading) return;

    setLastScanned(qrData);
    setLoading(true);
    setScanResult(null);

    try {
      const res = await fetch(`/api/sponsors/${resolvedParams.sponsorId}/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendeeId: qrData }),
      });

      const data = await res.json();
      
      if (res.ok) {
        setScanResult({
          success: true,
          message: "Lead captured!",
          guestName: data.attendee.guest_name,
          ticketType: data.attendee.ticket_type,
        });
        toast.success(`Lead captured: ${data.attendee.guest_name}`);
      } else {
        setScanResult({
          success: false,
          message: data.error || "Scan failed",
        });
        toast.error(data.error || "Scan failed");
      }
    } catch {
      setScanResult({ success: false, message: "Network error occurred." });
      toast.error("Network error");
    } finally {
      setLoading(false);
      
      // Reset scan after 3 seconds so they can scan the next person
      setTimeout(() => {
        setScanResult(null);
        setLastScanned(null);
      }, 3000);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] p-4 max-w-lg mx-auto">
      <div className="mb-6 text-center mt-8">
        <h1 className="text-2xl font-bold font-display">Sponsor Lead Capture</h1>
        <p className="text-muted-foreground text-sm mt-1">Scan attendee badges to save their details.</p>
      </div>

      <Card className="flex-1 overflow-hidden flex flex-col">
        <CardContent className="p-0 flex-1 relative bg-black flex items-center justify-center">
          <Scanner 
            onScan={handleScan}
            styles={{ container: { width: '100%', height: '100%' } }}
          />
          
          {loading && (
            <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
              <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
              <p className="font-semibold text-lg">Saving lead...</p>
            </div>
          )}

          {scanResult && !loading && (
            <div className={`absolute inset-0 flex flex-col items-center justify-center z-20 text-white p-6 text-center ${scanResult.success ? 'bg-emerald-500/95' : 'bg-destructive/95'}`}>
              {scanResult.success ? (
                <CheckCircle className="w-20 h-20 mb-4" />
              ) : (
                <XCircle className="w-20 h-20 mb-4" />
              )}
              
              <h2 className="text-3xl font-bold mb-2">{scanResult.message}</h2>
              
              {scanResult.guestName && (
                <div className="mt-4 bg-white/20 px-6 py-4 rounded-xl w-full">
                  <p className="text-xl font-semibold">{scanResult.guestName}</p>
                  {scanResult.ticketType && <p className="text-sm opacity-90">{scanResult.ticketType}</p>}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="mt-4 text-center">
        <p className="text-xs text-muted-foreground">Ensure camera permissions are granted.</p>
      </div>

      <div aria-live="polite" className="sr-only">
        {scanResult ? `${scanResult.message} ${scanResult.guestName ? `for ${scanResult.guestName}` : ''}` : ''}
      </div>
    </div>
  );
}
