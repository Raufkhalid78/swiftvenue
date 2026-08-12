import React from 'react';
import { Badge } from '@/components/ui/badge';

// Color palettes for different ticket tiers
const tierColors = [
  { bg: 'bg-emerald-100 dark:bg-emerald-900/40', border: 'border-emerald-300 dark:border-emerald-800', text: 'text-emerald-800 dark:text-emerald-100', hover: 'hover:bg-emerald-200 dark:hover:bg-emerald-900/80', dot: 'bg-emerald-100 border-emerald-300' },
  { bg: 'bg-blue-100 dark:bg-blue-900/40', border: 'border-blue-300 dark:border-blue-800', text: 'text-blue-800 dark:text-blue-100', hover: 'hover:bg-blue-200 dark:hover:bg-blue-900/80', dot: 'bg-blue-100 border-blue-300' },
  { bg: 'bg-purple-100 dark:bg-purple-900/40', border: 'border-purple-300 dark:border-purple-800', text: 'text-purple-800 dark:text-purple-100', hover: 'hover:bg-purple-200 dark:hover:bg-purple-900/80', dot: 'bg-purple-100 border-purple-300' },
  { bg: 'bg-amber-100 dark:bg-amber-900/40', border: 'border-amber-300 dark:border-amber-800', text: 'text-amber-800 dark:text-amber-100', hover: 'hover:bg-amber-200 dark:hover:bg-amber-900/80', dot: 'bg-amber-100 border-amber-300' },
  { bg: 'bg-rose-100 dark:bg-rose-900/40', border: 'border-rose-300 dark:border-rose-800', text: 'text-rose-800 dark:text-rose-100', hover: 'hover:bg-rose-200 dark:hover:bg-rose-900/80', dot: 'bg-rose-100 border-rose-300' },
];

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
    
    // Find tier color index
    let colorClass = 'bg-emerald-100 border-emerald-300 text-emerald-800 hover:bg-emerald-200';
    if (ticketTypes && ticketTypes.length > 0) {
      const tIndex = ticketTypes.findIndex((t: any) => t.id === seat.ticket_type_id);
      if (tIndex >= 0) {
        const c = tierColors[tIndex % tierColors.length];
        colorClass = `${c.bg} ${c.border} ${c.text} ${c.hover}`;
      }
    }

    return `${colorClass} cursor-pointer`;
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
      
      <div className="flex flex-col items-center gap-3">
        {/* Tier Legend */}
        {ticketTypes && ticketTypes.length > 0 && (
          <div className="flex flex-wrap gap-4 text-xs font-medium text-muted-foreground justify-center mb-2">
            {ticketTypes.map((t: any, i: number) => {
              const c = tierColors[i % tierColors.length];
              return (
                <div key={t.id} className="flex items-center gap-1.5">
                  <div className={`w-4 h-4 rounded border ${c.dot}`}></div> 
                  {t.name} ({Number(t.price) === 0 ? 'Free' : `PKR ${t.price}`})
                </div>
              );
            })}
          </div>
        )}

        {/* State Legend */}
        <div className="flex flex-wrap gap-4 text-xs font-medium text-muted-foreground justify-center">
          <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-primary"></div> Selected</div>
          <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-destructive/20 border border-destructive/50"></div> Sold / Locked</div>
          <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-muted/40 border border-border/60"></div> Unassigned</div>
        </div>
      </div>
    </div>
  );
}
