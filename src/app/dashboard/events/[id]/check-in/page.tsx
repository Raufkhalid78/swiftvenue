"use client";

import React, { useState, useEffect, use } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, WifiOff, Wifi, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { get, set } from "idb-keyval";
import { syncAttendees, bulkCheckIn } from "./actions";
import { WalkInModal } from "./walk-in-modal";

interface AttendeeCache {
  id: string;
  guestName: string;
  status: string;
  ticketType: string;
}

export default function CheckInPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;
  
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [outboxCount, setOutboxCount] = useState(0);
  
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    guestName?: string;
    ticketType?: string;
  } | null>(null);

  // Network listener
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => { setIsOnline(true); syncOutbox(); };
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    // Initial outbox check
    checkOutboxCount();
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const checkOutboxCount = async () => {
    const outbox: string[] = await get(`outbox_${eventId}`) || [];
    setOutboxCount(outbox.length);
  };

  const handleSyncAttendees = async () => {
    if (!isOnline) {
      toast.error("You must be online to sync event data.");
      return;
    }
    setIsSyncing(true);
    try {
      // First sync outbox if any
      await syncOutbox();
      
      const attendees = await syncAttendees(eventId);
      await set(`attendees_${eventId}`, attendees);
      toast.success(`Successfully cached ${attendees.length} attendees for offline check-in.`);
    } catch (err: any) {
      toast.error(`Sync failed: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const syncOutbox = async () => {
    try {
      const outbox: string[] = await get(`outbox_${eventId}`) || [];
      if (outbox.length > 0) {
        const res = await bulkCheckIn(eventId, outbox);
        if (res.success) {
          await set(`outbox_${eventId}`, []); // clear outbox
          setOutboxCount(0);
          toast.success(`Synced ${res.count} offline check-ins!`);
        }
      }
    } catch (e) {
      console.error("Failed to sync outbox", e);
    }
  };

  const handleScan = async (result: any) => {
    if (!result || !result[0]) return;
    
    const qrData = result[0].rawValue;
    if (qrData === lastScanned || loading) return;

    setLastScanned(qrData);
    setLoading(true);
    setScanResult(null);

    try {
      // Offline/Local Cache Check First
      const cache: AttendeeCache[] = await get(`attendees_${eventId}`) || [];
      const localAttendee = cache.find(a => a.id === qrData);

      if (localAttendee) {
        if (localAttendee.status === 'attended') {
          setScanResult({
            success: false,
            message: "Already checked in",
            guestName: localAttendee.guestName,
          });
          toast.error("Already checked in");
        } else if (localAttendee.status === 'registered') {
          // Check them in locally
          localAttendee.status = 'attended';
          await set(`attendees_${eventId}`, cache); // update cache
          
          // Add to outbox
          const outbox: string[] = await get(`outbox_${eventId}`) || [];
          outbox.push(qrData);
          await set(`outbox_${eventId}`, outbox);
          setOutboxCount(outbox.length);

          setScanResult({
            success: true,
            message: "Check-in successful! (Local)",
            guestName: localAttendee.guestName,
            ticketType: localAttendee.ticketType,
          });
          toast.success(`Checked in: ${localAttendee.guestName}`);

          if (isOnline) {
            syncOutbox(); // background sync
          }
        } else {
          setScanResult({ success: false, message: `Ticket is ${localAttendee.status}`, guestName: localAttendee.guestName });
        }
      } else {
        // Not found in local cache. If online, try API fallback
        if (isOnline) {
          const res = await fetch("/api/check-in", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ attendeeId: qrData }),
          });
          const data = await res.json();
          if (res.ok) {
            setScanResult({
              success: true,
              message: "Check-in successful!",
              guestName: data.attendee.guest_name,
              ticketType: data.attendee.ticket_types?.name,
            });
            toast.success(`Checked in: ${data.attendee.guest_name}`);
          } else {
            setScanResult({
              success: false,
              message: data.error || "Check-in failed",
              guestName: data.attendee?.guest_name,
            });
            toast.error(data.error || "Check-in failed");
          }
        } else {
          // Offline and not in cache
          setScanResult({ success: false, message: "Ticket not found in offline cache." });
          toast.error("Not found. Connect to internet to sync.");
        }
      }
    } catch {
      setScanResult({ success: false, message: "Error occurred." });
      toast.error("Error occurred during scan");
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
      <div className="mb-4 flex flex-col items-center">
        <h1 className="text-2xl font-bold font-display">Event Check-In</h1>
        <p className="text-muted-foreground text-sm mb-4">Scan QR codes at the door</p>
        
        <div className="flex w-full items-center justify-between bg-muted/30 p-3 rounded-lg border border-border">
          <div className="flex items-center gap-2">
            {isOnline ? <Wifi className="w-4 h-4 text-emerald-500" /> : <WifiOff className="w-4 h-4 text-destructive" />}
            <span className={`text-sm font-medium ${!isOnline ? 'text-destructive' : ''}`}>
              {isOnline ? "Online Mode" : "Offline Mode"}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {outboxCount > 0 && (
              <span className="text-xs bg-amber-500/20 text-amber-600 px-2 py-1 rounded-full font-medium">
                {outboxCount} pending sync
              </span>
            )}
            <Button size="sm" variant="outline" onClick={handleSyncAttendees} disabled={isSyncing || !isOnline}>
              {isSyncing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Sync Data
            </Button>
            <WalkInModal eventId={eventId} />
          </div>
        </div>
      </div>

      <Card className="flex-1 overflow-hidden flex flex-col relative border-4 border-transparent focus-within:border-primary transition-colors">
        {!isOnline && (
          <div className="absolute top-0 left-0 right-0 bg-destructive/10 text-destructive text-xs text-center py-1 font-semibold z-30 flex items-center justify-center gap-2 border-b border-destructive/20">
            <WifiOff className="w-3 h-3" /> No connection. Using local cache.
          </div>
        )}
        <CardContent className="p-0 flex-1 relative bg-black flex items-center justify-center">
          <Scanner 
            onScan={handleScan}
            styles={{ container: { width: '100%', height: '100%' } }}
          />
          
          {loading && (
            <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
              <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
              <p className="font-semibold text-lg">Verifying ticket...</p>
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
    </div>
  );
}
