"use client";
import { useState } from "react";
import Papa from "papaparse";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ParsedGuest { name: string; email: string; }

export default function ImportGuestsPage() {
  const params = useParams();
  const router = useRouter();
  const [parsedGuests, setParsedGuests] = useState<ParsedGuest[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);

  function handleFileUpload(file: File) {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as any[];
        const valid: ParsedGuest[] = [];
        const rowErrors: string[] = [];

        rows.forEach((row, i) => {
          const name = row.name || row.Name || row.full_name || row["Full Name"] || row["full name"];
          const email = row.email || row.Email || row["email address"] || row["Email Address"];
          
          if (!name || !email) {
            rowErrors.push(`Row ${i + 2}: missing name or email`);
          } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            rowErrors.push(`Row ${i + 2}: invalid email "${email}"`);
          } else {
            valid.push({ name: String(name).trim(), email: String(email).trim() });
          }
        });

        setParsedGuests(valid);
        setErrors(rowErrors);
      },
    });
  }

  async function handleImport() {
    if (parsedGuests.length === 0) return;
    setImporting(true);
    
    try {
      const res = await fetch(`/api/events/${params.id}/guests/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guests: parsedGuests }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        toast.error(data.error || 'Import failed');
        setImporting(false);
        return;
      }
      
      toast.success(`Imported ${data.imported} guest(s)`);
      router.push(`/dashboard/events/${params.id}/guests`);
    } catch (err) {
      toast.error('An unexpected error occurred during import');
      setImporting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4 mb-2">
        <Link 
          href={`/dashboard/events/${params.id}/guests`}
          className="p-2 hover:bg-muted rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Import Guests</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Upload a CSV with <code>name</code> and <code>email</code> columns. This adds attendees directly without going through ticket purchase — useful for invite-only events.
          </p>
        </div>
      </div>

      <div className="border border-dashed border-border rounded-xl p-8 bg-card flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h2"/><path d="M8 17h2"/><path d="M14 13h2"/><path d="M14 17h2"/></svg>
        </div>
        <h3 className="font-medium text-foreground mb-1">Select CSV File</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-sm">
          File should include headers for name and email. Maximum 1000 rows per import.
        </p>
        <label className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors">
          Browse Files
          <input 
            type="file" 
            accept=".csv" 
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }} 
          />
        </label>
      </div>

      {errors.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-sm">
          <p className="font-medium mb-2 text-destructive">{errors.length} row(s) had issues and won't be imported:</p>
          <ul className="list-disc pl-5 space-y-1 text-destructive/90">
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      {parsedGuests.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium">{parsedGuests.length} guest(s) ready to import:</p>
            <Button onClick={handleImport} disabled={importing}>
              {importing ? 'Importing...' : `Import ${parsedGuests.length} Guests`}
            </Button>
          </div>
          <div className="max-h-[400px] overflow-y-auto border border-border rounded-lg divide-y bg-background">
            {parsedGuests.map((g, i) => (
              <div key={i} className="p-3 text-sm flex justify-between items-center hover:bg-muted/50 transition-colors">
                <span className="font-medium">{g.name}</span>
                <span className="text-muted-foreground">{g.email}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
