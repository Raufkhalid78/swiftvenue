import React from 'react';
import { Badge } from '@/components/ui/badge';

export function SeatPicker({ seatingLayout, seats, ticketTypes, selectedSeatIds, onSeatToggle }: any) {
  const { rows, cols } = seatingLayout;

  const getLabel = (r: number, c: number) => {
    const rowChar = String.fromCharCode(65 + r);
    return `${rowChar}${c + 1}`;
  };

  const getSeatColor = (seat: any, isSelected: boolean) => {
    if (!seat) return 'bg-transparent border-transparent';
    if (!seat.ticket_type_id) return 'bg-muted/40 border-solid border-border/60 text-muted-foreground/30 cursor-not-allowed'; // Unassigned
    if (seat.status !== 'available') return 'bg-destructive/20 border-destructive/50 text-destructive/50 cursor-not-allowed';
    if (isSelected) return 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2';
    
    // Available
    return 'bg-emerald-100 border-emerald-300 text-emerald-800 hover:bg-emerald-200 cursor-pointer';
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-muted/30 rounded-xl border border-border overflow-x-auto">
        <div className="min-w-max mx-auto flex flex-col items-center">
          <div className="w-full max-w-sm bg-slate-300 dark:bg-slate-800 rounded-t-[100px] py-2 mb-6 text-center text-xs font-bold tracking-widest text-slate-500 uppercase">
            Stage
          </div>
          
          <div 
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: rows }).map((_, r) => (
              Array.from({ length: cols }).map((_, c) => {
                const label = getLabel(r, c);
                const seat = seats.find((s: any) => s.label === label);
                const isSelected = selectedSeatIds.includes(seat?.id);

                return (
                  <div
                    key={label}
                    onClick={() => {
                      if (seat && seat.ticket_type_id && seat.status === 'available') {
                        onSeatToggle(seat.id);
                      }
                    }}
                    className={`
                      w-8 h-8 sm:w-10 sm:h-10 rounded-t-lg rounded-b-sm border text-[10px] sm:text-xs font-medium flex flex-col items-center justify-center transition-all
                      ${getSeatColor(seat, isSelected)}
                    `}
                    title={seat ? `${label} - ${ticketTypes.find((t: any) => t.id === seat.ticket_type_id)?.name || 'General'}` : 'Empty Space'}
                  >
                    {seat ? label : ''}
                  </div>
                )
              })
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-4 text-xs font-medium text-muted-foreground justify-center">
        <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-300"></div> Available</div>
        <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-primary"></div> Selected</div>
        <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-destructive/20 border border-destructive/50"></div> Sold / Locked</div>
        <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-muted/40 border border-border/60"></div> Unassigned</div>
      </div>
    </div>
  );
}
