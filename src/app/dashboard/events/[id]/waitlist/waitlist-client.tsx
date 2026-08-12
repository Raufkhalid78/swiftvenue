"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { forceWaitlistOffer, removeWaitlistEntry } from "./actions";
import { toast } from "sonner";
import { Loader2, Mail, Trash2 } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export default function WaitlistClient({ eventId, initialData }: { eventId: string, initialData: any[] }) {
  const [data, setData] = useState(initialData);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleForceOffer = async (id: string) => {
    setProcessingId(id);
    try {
      await forceWaitlistOffer(eventId, id);
      toast.success("Offer sent! They have 2 hours to claim the ticket.");
      setData(data.map(w => w.id === id ? { ...w, status: 'notified' } : w));
    } catch (e: any) {
      toast.error(e.message || "Failed to send offer");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRemove = async (id: string) => {
    setProcessingId(id);
    try {
      await removeWaitlistEntry(eventId, id);
      toast.success("Entry removed from waitlist");
      setData(data.filter(w => w.id !== id));
    } catch (e: any) {
      toast.error(e.message || "Failed to remove entry");
    } finally {
      setProcessingId(null);
    }
  };

  if (data.length === 0) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        No one is on the waitlist yet.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Attendee</TableHead>
          <TableHead>Ticket Type</TableHead>
          <TableHead>Joined</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell>
              <div className="font-medium">{entry.user_name}</div>
              <div className="text-sm text-muted-foreground">{entry.user_email}</div>
            </TableCell>
            <TableCell>{entry.ticket_types?.name}</TableCell>
            <TableCell>
              <div className="text-sm">{dayjs(entry.created_at).format("MMM D, YYYY")}</div>
              <div className="text-xs text-muted-foreground">{dayjs(entry.created_at).fromNow()}</div>
            </TableCell>
            <TableCell>
              {entry.status === 'waiting' && <Badge variant="outline" className="text-amber-500 border-amber-500/30">Waiting</Badge>}
              {entry.status === 'notified' && <Badge variant="outline" className="text-blue-500 border-blue-500/30">Notified</Badge>}
              {entry.status === 'claimed' && <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">Claimed</Badge>}
              {entry.status === 'expired' && <Badge variant="outline" className="text-destructive border-destructive/30">Expired</Badge>}
            </TableCell>
            <TableCell className="text-right space-x-2">
              {entry.status === 'waiting' && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleForceOffer(entry.id)}
                  disabled={processingId === entry.id}
                >
                  {processingId === entry.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Mail className="w-3 h-3 mr-1" />}
                  Force Offer
                </Button>
              )}
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-destructive hover:bg-destructive/10"
                onClick={() => handleRemove(entry.id)}
                disabled={processingId === entry.id}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
