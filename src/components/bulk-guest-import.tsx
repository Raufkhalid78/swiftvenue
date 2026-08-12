"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, Check, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

export function BulkGuestImport({ 
  eventId, 
  onSuccess 
}: { 
  eventId: string; 
  onSuccess?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [ticketTypes, setTicketTypes] = useState<any[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchTicketTypes = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("ticket_types")
      .select("id, name, price")
      .eq("event_id", eventId)
      .eq("is_active", true);
    if (data && data.length > 0) {
      setTicketTypes(data);
      setSelectedTicketId(data[0].id);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsing(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const validRows = results.data.filter((row: any) => row.name || row.email);
        setParsedData(validRows);
        setParsing(false);
      },
      error: (error) => {
        toast.error("Error parsing CSV: " + error.message);
        setParsing(false);
      }
    });
  };

  const handleUpload = async () => {
    if (parsedData.length === 0) {
      toast.error("No valid data to import");
      return;
    }
    if (!selectedTicketId) {
      toast.error("Please select a ticket type for these guests");
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const ticket = ticketTypes.find(t => t.id === selectedTicketId);

    try {
      const attendeesToInsert = parsedData.map(row => ({
        event_id: eventId,
        order_id: crypto.randomUUID(), // Mock order ID for comps
        guest_name: row.name || row.Name || 'Unknown',
        guest_email: row.email || row.Email || null,
        ticket_type_id: selectedTicketId,
        ticket_type: ticket?.name,
        ticket_price: 0,
        ticket_currency: 'PKR',
        ticket_number: `COMP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        status: 'registered',
        is_comp: true
      }));

      const { error } = await supabase.from('attendees').insert(attendeesToInsert);

      if (error) throw error;

      toast.success(`Successfully imported ${attendeesToInsert.length} guests!`);
      setIsOpen(false);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error("Failed to import guests: " + error.message);
    } finally {
      setUploading(false);
      setParsedData([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => {
      setIsOpen(val);
      if (val) fetchTicketTypes();
      if (!val) {
        setParsedData([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="w-4 h-4" /> Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Import Guests</DialogTitle>
          <DialogDescription>
            Upload a CSV file with <code className="bg-muted px-1 py-0.5 rounded text-foreground">name</code> and <code className="bg-muted px-1 py-0.5 rounded text-foreground">email</code> columns to issue complimentary tickets.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">1. Select Ticket Type to Issue</label>
            <select 
              className="w-full h-10 px-3 rounded-md border border-input bg-background"
              value={selectedTicketId}
              onChange={(e) => setSelectedTicketId(e.target.value)}
            >
              {ticketTypes.map(t => (
                <option key={t.id} value={t.id}>{t.name} (Comp/Free)</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">2. Upload CSV File</label>
            <div 
              className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileSpreadsheet className="w-8 h-8 text-muted-foreground" />
              <div className="text-sm text-center">
                <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                <p className="text-xs text-muted-foreground mt-1">.csv files only</p>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                accept=".csv" 
                className="hidden" 
                onChange={handleFileChange}
              />
            </div>
          </div>

          {parsing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Parsing CSV...
            </div>
          )}

          {parsedData.length > 0 && (
            <div className="bg-emerald-500/10 text-emerald-600 p-3 rounded-md text-sm flex items-start gap-2">
              <Check className="w-5 h-5 shrink-0" />
              <div>
                <strong>{parsedData.length} valid guests found!</strong>
                <p className="opacity-90 mt-1">They will be issued complimentary "{ticketTypes.find(t=>t.id === selectedTicketId)?.name}" tickets.</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)} disabled={uploading}>Cancel</Button>
          <Button onClick={handleUpload} disabled={parsedData.length === 0 || uploading || parsing}>
            {uploading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importing...</>
            ) : (
              "Confirm Import"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
