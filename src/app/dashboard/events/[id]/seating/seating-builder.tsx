"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { saveSeatingLayout } from "./actions";
import { Loader2, Plus, Minus, Save, MousePointerClick, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function SeatingBuilder({ eventId, initialLayout, initialSeats, ticketTypes }: any) {
  const [rows, setRows] = useState(initialLayout.rows || 10);
  const [cols, setCols] = useState(initialLayout.cols || 20);
  const [seats, setSeats] = useState<any[]>(initialSeats || []);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Generate a label (e.g. A1, B2)
  const getLabel = (r: number, c: number) => {
    const rowChar = String.fromCharCode(65 + r); // A, B, C...
    return `${rowChar}${c + 1}`;
  };

  const handleSeatClick = (r: number, c: number) => {
    const label = getLabel(r, c);
    if (selectedSeats.includes(label)) {
      setSelectedSeats(prev => prev.filter(s => s !== label));
    } else {
      setSelectedSeats(prev => [...prev, label]);
    }
  };

  const selectRow = (r: number) => {
    const rowLabels = Array.from({ length: cols }).map((_, c) => getLabel(r, c));
    const allSelected = rowLabels.every(l => selectedSeats.includes(l));
    if (allSelected) {
      setSelectedSeats(prev => prev.filter(s => !rowLabels.includes(s)));
    } else {
      setSelectedSeats(prev => Array.from(new Set([...prev, ...rowLabels])));
    }
  };

  const selectColumn = (c: number) => {
    const colLabels = Array.from({ length: rows }).map((_, r) => getLabel(r, c));
    const allSelected = colLabels.every(l => selectedSeats.includes(l));
    if (allSelected) {
      setSelectedSeats(prev => prev.filter(s => !colLabels.includes(s)));
    } else {
      setSelectedSeats(prev => Array.from(new Set([...prev, ...colLabels])));
    }
  };

  const assignTicketType = (ticketTypeId: string | null) => {
    if (selectedSeats.length === 0) {
      toast.error("Select seats first");
      return;
    }

    setSeats(prev => {
      let newSeats = [...prev];
      selectedSeats.forEach(label => {
        const existingIdx = newSeats.findIndex(s => s.label === label);
        if (existingIdx >= 0) {
          if (ticketTypeId === null) {
            // Remove seat (make it blank space)
            newSeats.splice(existingIdx, 1);
          } else {
            // Update ticket type
            newSeats[existingIdx].ticket_type_id = ticketTypeId;
          }
        } else if (ticketTypeId !== null) {
          // Add new seat
          newSeats.push({ label, ticket_type_id: ticketTypeId, status: 'available' });
        }
      });
      return newSeats;
    });
    setSelectedSeats([]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSeatingLayout(eventId, { rows, cols }, seats);
      toast.success("Seating layout saved!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const getSeatColor = (label: string) => {
    if (selectedSeats.includes(label)) return "bg-primary text-primary-foreground border-primary ring-2 ring-primary ring-offset-2";

    const seat = seats.find(s => s.label === label);
    if (!seat) return "bg-muted/20 border-dashed border-border/50 text-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50"; // blank space
    
    if (seat.status !== 'available') return "bg-destructive/20 border-destructive/50 text-destructive/50 cursor-not-allowed"; // sold/locked

    // Has a ticket type assigned
    return "bg-emerald-100 border-emerald-300 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:border-emerald-800 dark:text-emerald-100 dark:hover:bg-emerald-900/80";
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
      {/* Editor Main */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-background border border-border rounded-lg p-1">
              <span className="text-xs font-semibold px-2">Rows: {rows}</span>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setRows(r => Math.max(1, r - 1))}><Minus className="w-3 h-3"/></Button>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setRows(r => r + 1)}><Plus className="w-3 h-3"/></Button>
            </div>
            <div className="flex items-center gap-2 bg-background border border-border rounded-lg p-1">
              <span className="text-xs font-semibold px-2">Cols: {cols}</span>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setCols(c => Math.max(1, c - 1))}><Minus className="w-3 h-3"/></Button>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setCols(c => c + 1)}><Plus className="w-3 h-3"/></Button>
            </div>
          </div>
          
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save Layout
          </Button>
        </div>

        <CardContent className="flex-1 overflow-auto p-8 bg-zinc-50 dark:bg-zinc-950 flex justify-center items-center">
          <div className="inline-flex flex-col gap-2">
            {/* Stage indicator */}
            <div className="w-full bg-slate-300 dark:bg-slate-800 rounded-t-[100px] py-4 mb-8 text-center text-sm font-bold tracking-widest text-slate-500 uppercase">
              Stage
            </div>
            
            <div 
              className="grid gap-2"
              style={{ gridTemplateColumns: `32px repeat(${cols}, minmax(0, 1fr))` }}
            >
              {/* Top Row for Column Labels */}
              <div />
              {Array.from({ length: cols }).map((_, c) => (
                <button
                  key={`col-label-${c}`}
                  onClick={() => selectColumn(c)}
                  className="text-[10px] font-bold text-muted-foreground hover:text-foreground mb-1 w-8 flex items-center justify-center transition-colors"
                  title={`Select Column ${c + 1}`}
                >
                  {c + 1}
                </button>
              ))}

              {Array.from({ length: rows }).map((_, r) => (
                <React.Fragment key={`row-${r}`}>
                  {/* Left Column for Row Labels */}
                  <button
                    onClick={() => selectRow(r)}
                    className="text-[10px] font-bold text-muted-foreground hover:text-foreground flex items-center justify-center mr-1 transition-colors"
                    title={`Select Row ${String.fromCharCode(65 + r)}`}
                  >
                    {String.fromCharCode(65 + r)}
                  </button>

                  {/* Seats */}
                  {Array.from({ length: cols }).map((_, c) => {
                    const label = getLabel(r, c);
                    return (
                      <button
                        key={label}
                        onClick={() => handleSeatClick(r, c)}
                        className={`
                          w-8 h-8 rounded-t-lg rounded-b-sm border text-[10px] font-medium flex items-center justify-center transition-all
                          ${getSeatColor(label)}
                        `}
                        title={label}
                      >
                        {seats.find(s => s.label === label) ? label : ''}
                      </button>
                    )
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sidebar Tool */}
      <Card className="w-full lg:w-80 flex flex-col">
        <div className="p-4 border-b border-border bg-muted/30">
          <h2 className="font-semibold flex items-center gap-2">
            <MousePointerClick className="w-4 h-4 text-primary" /> 
            Selected: {selectedSeats.length}
          </h2>
        </div>
        <CardContent className="p-4 flex-1 space-y-6">
          
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground font-medium">Assign Ticket Tier</p>
            {ticketTypes.map((t: any) => (
              <Button 
                key={t.id} 
                variant="outline" 
                className="w-full justify-between"
                onClick={() => assignTicketType(t.id)}
              >
                <span className="truncate">{t.name}</span>
                <Badge variant="secondary">PKR {t.price}</Badge>
              </Button>
            ))}
          </div>

          <div className="space-y-3 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground font-medium">Clear Seats (Walkway)</p>
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={() => assignTicketType(null)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remove Selected
            </Button>
            <p className="text-xs text-muted-foreground">Removing a seat turns it into an empty space on the grid.</p>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
