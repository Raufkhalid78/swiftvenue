"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Minus, Ticket, Tag, X } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCurrency } from "./currency-provider";

const SeatPicker = dynamic(
  () => import("./seat-picker").then((m) => m.SeatPicker),
  {
    ssr: false,
    loading: () => (
      <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading interactive seating map...
      </div>
    ),
  }
);

export function RegistrationWidget({ 
  eventId, 
  eventTitle,
  ticketTypes = [],
  seatingLayout,
  seats = [],
}: { 
  eventId: string, 
  eventTitle: string,
  ticketTypes?: any[],
  seatingLayout?: any,
  seats?: any[],
}) {
  const { targetCurrency, exchangeRate } = useCurrency();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [selectedTicketId, setSelectedTicketId] = useState<string>(seatingLayout ? "" : (ticketTypes[0]?.id || ""));
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [manualQuantity, setManualQuantity] = useState(1);
  const activeQuantity = seatingLayout ? selectedSeatIds.length : manualQuantity;
  const [attendeeDetails, setAttendeeDetails] = useState(Array(1).fill({ name: "", email: "" }));
  const [customResponses, setCustomResponses] = useState<Record<string, any>>({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    setAttendeeDetails(prev => {
      const next = [...prev];
      while (next.length < activeQuantity) next.push({ name: "", email: "" });
      return next.slice(0, activeQuantity);
    });
  }, [activeQuantity]);
  
  const [promoCode, setPromoCode] = useState("");
  const [promoData, setPromoData] = useState<{valid: boolean, discount_type?: string, discount_amount?: number} | null>(null);
  const [validatingPromo, setValidatingPromo] = useState(false);

  // Read payment errors from URL if redirected back from checkout
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const paymentError = params.get('paymentError');
      if (paymentError) {
        toast.error(`Payment Error: ${paymentError}`);
        // Optionally clean up the URL without reloading
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, []);

  const selectedTicket = ticketTypes.find(t => t.id === selectedTicketId);
  const available = selectedTicket ? selectedTicket.quantity_total - selectedTicket.quantity_sold : 0;
  const isWaitlist = selectedTicket ? available <= 0 : false;

  async function validatePromo() {
    if (!promoCode) return;
    setValidatingPromo(true);
    try {
      const res = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: promoCode, 
          eventId, 
          ticketTypeId: selectedTicketId, 
          quantity: activeQuantity,
          orderAmount: selectedTicket ? Number(selectedTicket.price) * activeQuantity : 0
        })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Invalid promo code");
        setPromoData(null);
      } else {
        toast.success("Promo code applied!");
        setPromoData(data);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setValidatingPromo(false);
    }
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error("Please fill out all fields.");
      return;
    }
    if (!selectedTicketId || (seatingLayout && selectedSeatIds.length === 0)) {
      toast.error(seatingLayout ? "Please select at least one seat." : "Please select a ticket type.");
      return;
    }

    // Validate required custom questions
    if (selectedTicket?.custom_questions && Array.isArray(selectedTicket.custom_questions)) {
      for (const q of selectedTicket.custom_questions) {
        if (q.required && (!customResponses[q.id] || customResponses[q.id] === "")) {
          toast.error(`Please answer: "${q.label}"`);
          return;
        }
      }
    }

    setLoading(true);

    if (isWaitlist) {
      // Handle Waitlist (Phase 5)
      try {
        const response = await fetch('/api/waitlist/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId,
            guestName: formData.name,
            guestEmail: formData.email,
            ticketTypeId: selectedTicketId,
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to join waitlist');
        toast.success("You've been added to the waitlist!");
        setIsOpen(false);
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const response = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          guestName: formData.name,
          guestEmail: formData.email,
          guestPhone: formData.phone,
          ticketTypeId: selectedTicketId,
          quantity: activeQuantity,
          seatIds: seatingLayout ? selectedSeatIds : undefined,
          promoCode: promoData?.valid ? promoCode : undefined,
          attendeeDetails: !isWaitlist ? attendeeDetails : undefined,
          customResponses: Object.keys(customResponses).length > 0 ? customResponses : undefined
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        const errorMsg = data.details ? `${data.error}: ${data.details}` : data.error;
        throw new Error(errorMsg || 'Failed to initiate checkout');
      }

      if (data.checkoutUrl) {
        window.location.assign(data.checkoutUrl);
      } else {
        // Handle free tickets
        toast.success("Ticket registered successfully!");
        window.location.assign(`${window.location.pathname}/success?order=${data.orderId}`);
      }
    } catch (error: any) {
      toast.error(error.message);
      setLoading(false);
    }
  }

  const hasTickets = ticketTypes && ticketTypes.length > 0;
  
  // Calculate total
  let subtotal = 0;
  let total = 0;
  let currency = "PKR";
  if (selectedTicket) {
    subtotal = Number(selectedTicket.price) * activeQuantity;
    total = subtotal;
    currency = selectedTicket.currency || "PKR";
    if (promoData?.valid) {
      if (promoData.discount_type === 'percentage') {
        total = subtotal - (subtotal * ((promoData.discount_amount ?? 0) / 100));
      } else if (promoData.discount_type === 'fixed') {
        total = Math.max(0, subtotal - (promoData.discount_amount ?? 0));
      }
    }
  }

  return (
    <>
      <div id="tickets" data-tickets-section className="p-6 rounded-2xl bg-primary/10 border border-primary/20 text-center scroll-mt-24">
        <h3 className="font-semibold text-lg mb-2 text-foreground">Secure your spot</h3>
        <p className="text-sm text-muted-foreground mb-4">Tickets for {eventTitle} are available now.</p>
        <Button 
          id="get-tickets-btn"
          onClick={() => setIsOpen(true)} 
          className="w-full"
          disabled={!hasTickets}
        >
          {hasTickets ? "Get Tickets" : "Tickets Unavailable"}
        </Button>
      </div>

      {mounted && isOpen && hasTickets && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}
        >
          <div className={`bg-card text-foreground w-full ${seatingLayout ? 'max-w-2xl lg:max-w-3xl' : 'max-w-md'} rounded-3xl shadow-2xl border border-border p-6 sm:p-8 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto relative`}>
            
            {/* Top Close Button */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              aria-label="Close registration dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="pr-8 mb-6">
              <h3 className="text-2xl font-bold font-display tracking-tight text-foreground">Register for Event</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {seatingLayout ? "Select your preferred seat on the map and complete registration." : "Select your ticket tier and enter your details."}
              </p>
            </div>
            
            <form onSubmit={handleCheckout} className="space-y-4">
              <div className="space-y-3 mb-6">
                <Label>{seatingLayout ? "Select Your Seats on the Map" : "Select Ticket Tier"}</Label>
                {seatingLayout && (
                  <p className="text-xs text-muted-foreground mt-0 mb-2">Click multiple seats of the same color to purchase them together.</p>
                )}
                {seatingLayout ? (
                  <SeatPicker 
                    seatingLayout={seatingLayout} 
                    seats={seats} 
                    ticketTypes={ticketTypes} 
                    selectedSeatIds={selectedSeatIds} 
                    onSeatToggle={(seatId: string) => {
                      const seat = seats.find(s => s.id === seatId);
                      if (!seat) return;
                      
                      if (selectedSeatIds.includes(seatId)) {
                        const newSelection = selectedSeatIds.filter(id => id !== seatId);
                        setSelectedSeatIds(newSelection);
                        if (newSelection.length === 0) setSelectedTicketId("");
                      } else {
                        // Check if new seat belongs to same ticket type
                        if (selectedSeatIds.length > 0 && seat.ticket_type_id !== selectedTicketId) {
                          // Clear selection if different tier
                          setSelectedSeatIds([seatId]);
                          setSelectedTicketId(seat.ticket_type_id);
                          toast.info("Cleared previous seats: Please select seats of the same ticket tier in a single order.");
                        } else {
                          setSelectedSeatIds([...selectedSeatIds, seatId]);
                          setSelectedTicketId(seat.ticket_type_id);
                        }
                      }
                    }} 
                  />
                ) : (
                  ticketTypes.map(ticket => {
                    const tAvailable = ticket.quantity_total - ticket.quantity_sold;
                    const tSoldOut = tAvailable <= 0;
                    
                    return (
                      <div 
                        key={ticket.id}
                        onClick={() => {
                          setSelectedTicketId(ticket.id);
                          if(tSoldOut) setManualQuantity(1);
                        }}
                        className={`
                          p-4 rounded-xl border-2 flex items-start justify-between cursor-pointer transition-all
                          ${selectedTicketId === ticket.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                          ${tSoldOut && selectedTicketId !== ticket.id ? 'opacity-50' : ''}
                        `}
                      >
                        <div>
                          <div className="font-semibold flex items-center gap-2">
                            {ticket.name}
                            {tSoldOut && <span className="text-xs bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full">Waitlist</span>}
                          </div>
                          {ticket.description && (
                            <div className="text-xs text-muted-foreground mt-1">{ticket.description}</div>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <div className="font-bold whitespace-nowrap">
                            {Number(ticket.price) === 0 ? 'Free' : `${ticket.currency || 'PKR'} ${Number(ticket.price).toLocaleString()}`}
                          </div>
                          {targetCurrency !== 'PKR' && Number(ticket.price) > 0 && (
                            <div className="text-xs text-muted-foreground whitespace-nowrap mt-1">
                              ≈ {targetCurrency} {(Number(ticket.price) * exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {selectedTicket && !isWaitlist && !seatingLayout && (
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl mb-4">
                  <Label className="mb-0">Quantity</Label>
                  <div className="flex items-center gap-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8 rounded-full"
                      onClick={() => setManualQuantity(Math.max(1, manualQuantity - 1))}
                      disabled={manualQuantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="font-medium w-4 text-center">{manualQuantity}</span>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8 rounded-full"
                      onClick={() => setManualQuantity(Math.min((selectedTicket.quantity_total - selectedTicket.quantity_sold), manualQuantity + 1))}
                      disabled={manualQuantity >= (selectedTicket.quantity_total - selectedTicket.quantity_sold)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-4 pt-2">
                <h4 className="font-semibold text-sm">Buyer Details (Primary Contact)</h4>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    required 
                    placeholder="Jane Doe" 
                    value={formData.name}
                    onChange={e => {
                      const newName = e.target.value;
                      setFormData({ ...formData, name: newName });
                      // Auto-fill ticket 1 if empty
                      if (activeQuantity === 1 && !attendeeDetails[0]?.name) {
                        const newAtt = [...attendeeDetails];
                        newAtt[0] = { ...newAtt[0], name: newName };
                        setAttendeeDetails(newAtt);
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    required 
                    placeholder="jane@example.com" 
                    value={formData.email}
                    onChange={e => {
                      const newEmail = e.target.value;
                      setFormData({ ...formData, email: newEmail });
                      if (activeQuantity === 1 && !attendeeDetails[0]?.email) {
                        const newAtt = [...attendeeDetails];
                        newAtt[0] = { ...newAtt[0], email: newEmail };
                        setAttendeeDetails(newAtt);
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    placeholder="+923001234567" 
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              {!isWaitlist && activeQuantity > 0 && (
                <div className="space-y-4 pt-4 border-t border-border mt-4">
                  <h4 className="font-semibold text-sm">Ticket Holders</h4>
                  {attendeeDetails.map((attendee, index) => (
                    <div key={index} className="p-3 bg-muted/30 rounded-lg space-y-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {seatingLayout ? `Seat: ${seats.find(s => s.id === selectedSeatIds[index])?.label || ''}` : `Ticket ${index + 1}`}
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Name {index === 0 ? "(Required)" : "(Optional)"}</Label>
                          <Input 
                            required={index === 0}
                            placeholder="Ticket holder name" 
                            value={attendee.name}
                            onChange={(e) => {
                              const newDetails = [...attendeeDetails];
                              newDetails[index] = { ...newDetails[index], name: e.target.value };
                              setAttendeeDetails(newDetails);
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Email {index === 0 ? "(Required)" : "(Optional)"}</Label>
                          <Input 
                            type="email"
                            required={index === 0}
                            placeholder="Ticket holder email" 
                            value={attendee.email}
                            onChange={(e) => {
                              const newDetails = [...attendeeDetails];
                              newDetails[index] = { ...newDetails[index], email: e.target.value };
                              setAttendeeDetails(newDetails);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Custom Registration Questions */}
              {!isWaitlist && selectedTicket?.custom_questions && Array.isArray(selectedTicket.custom_questions) && selectedTicket.custom_questions.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-border mt-4">
                  <h4 className="font-semibold text-sm">Attendee Information</h4>
                  <div className="space-y-3 p-3.5 bg-muted/20 border border-border rounded-xl">
                    {selectedTicket.custom_questions.map((q: any) => (
                      <div key={q.id} className="space-y-1.5">
                        <Label className="text-xs font-medium flex items-center justify-between">
                          <span>{q.label}</span>
                          {q.required ? (
                            <span className="text-[10px] text-rose-500 font-semibold uppercase">Required</span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">Optional</span>
                          )}
                        </Label>

                        {q.type === 'text' && (
                          <Input 
                            required={q.required}
                            placeholder="Your answer"
                            value={customResponses[q.id] || ''}
                            onChange={e => setCustomResponses(prev => ({ ...prev, [q.id]: e.target.value }))}
                            className="h-8 text-xs"
                          />
                        )}

                        {q.type === 'number' && (
                          <Input 
                            type="number"
                            required={q.required}
                            placeholder="0"
                            value={customResponses[q.id] || ''}
                            onChange={e => setCustomResponses(prev => ({ ...prev, [q.id]: e.target.value }))}
                            className="h-8 text-xs"
                          />
                        )}

                        {q.type === 'select' && (
                          <select
                            required={q.required}
                            value={customResponses[q.id] || ''}
                            onChange={e => setCustomResponses(prev => ({ ...prev, [q.id]: e.target.value }))}
                            className="w-full h-8 text-xs bg-background border border-border rounded-md px-2"
                          >
                            <option value="">Select an option...</option>
                            {(q.options || []).map((opt: string, i: number) => (
                              <option key={i} value={opt}>{opt}</option>
                            ))}
                          </select>
                        )}

                        {q.type === 'checkbox' && (
                          <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer pt-1">
                            <input 
                              type="checkbox"
                              checked={!!customResponses[q.id]}
                              onChange={e => setCustomResponses(prev => ({ ...prev, [q.id]: e.target.checked }))}
                              className="rounded border-border"
                            />
                            <span>Yes, I agree / confirm</span>
                          </label>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {!isWaitlist && (
                <div className="space-y-2 pt-2">
                  <Label htmlFor="promo">Promo Code (Optional)</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        id="promo" 
                        placeholder="SUMMER2024" 
                        value={promoCode}
                        onChange={e => {
                          setPromoCode(e.target.value.toUpperCase());
                          setPromoData(null);
                        }}
                        className="pl-9"
                      />
                    </div>
                    <Button 
                      type="button" 
                      variant="secondary" 
                      onClick={validatePromo}
                      disabled={validatingPromo || !promoCode || promoData?.valid}
                    >
                      {validatingPromo ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="flex flex-col py-4 border-t border-border mt-4 gap-1">
                {promoData?.valid && (
                  <div className="flex justify-between items-center text-sm text-primary">
                    <div>Discount</div>
                    <div>- {currency} {(subtotal - total).toLocaleString()}</div>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">{total > 0 ? `Total (charged in ${currency})` : 'Total'}</div>
                  <div className="text-right">
                    <div className="text-xl font-bold">
                      {isWaitlist ? "Waitlist" : total > 0 ? `${currency} ${total.toLocaleString()}` : "Free"}
                    </div>
                    {targetCurrency !== 'PKR' && total > 0 && !isWaitlist && (
                      <div className="text-sm text-muted-foreground mt-1" title="Your bank sets the final exchange rate">
                        ≈ {targetCurrency} {(total * exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <label className="flex items-start gap-2 text-sm text-muted-foreground cursor-pointer">
                  <Checkbox 
                    checked={agreedToTerms} 
                    onCheckedChange={(v) => setAgreedToTerms(!!v)} 
                    className="mt-0.5" 
                    id="terms-checkbox"
                  />
                  <span>
                    I agree to SwiftVenue's <Link href="/terms" target="_blank" className="underline hover:text-primary">Terms of Service</Link> and the event's refund policy.
                  </span>
                </label>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsOpen(false)} disabled={loading}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading || (seatingLayout ? selectedSeatIds.length === 0 : !selectedTicket) || !agreedToTerms}>
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : isWaitlist ? (
                      "Join Waitlist"
                    ) : (
                      <><Ticket className="w-4 h-4 mr-2" /> {seatingLayout && selectedSeatIds.length === 0 ? "Select a seat" : "Checkout"}</>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
