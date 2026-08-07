"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Minus, Ticket } from "lucide-react";
import { toast } from "sonner";

export function RegistrationWidget({ 
  eventId, 
  eventTitle,
  ticketTypes = []
}: { 
  eventId: string, 
  eventTitle: string,
  ticketTypes?: any[]
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [selectedTicketId, setSelectedTicketId] = useState<string>(ticketTypes[0]?.id || "");
  const [quantity, setQuantity] = useState(1);

  const selectedTicket = ticketTypes.find(t => t.id === selectedTicketId);

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error("Please fill out all fields.");
      return;
    }

    if (!selectedTicketId) {
      toast.error("Please select a ticket type.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          guestName: formData.name,
          guestEmail: formData.email,
          ticketTypeId: selectedTicketId,
          quantity
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to initiate checkout');

      // Redirect to Safepay Checkout URL
      window.location.href = data.checkoutUrl;
    } catch (error: any) {
      toast.error(error.message);
      setLoading(false);
    }
  }

  const hasTickets = ticketTypes && ticketTypes.length > 0;

  return (
    <>
      <div className="p-6 rounded-2xl bg-primary/10 border border-primary/20 text-center">
        <h3 className="font-semibold text-lg mb-2 text-foreground">Secure your spot</h3>
        <p className="text-sm text-muted-foreground mb-4">Tickets for {eventTitle} are available now.</p>
        <Button 
          onClick={() => setIsOpen(true)} 
          className="w-full"
          disabled={!hasTickets}
        >
          {hasTickets ? "Get Tickets" : "Tickets Unavailable"}
        </Button>
      </div>

      {isOpen && hasTickets && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border p-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold font-display mb-2">Register for Event</h3>
            <p className="text-muted-foreground mb-6">Select your ticket tier and enter your details.</p>
            
            <form onSubmit={handleCheckout} className="space-y-4">
              <div className="space-y-3 mb-6">
                <Label>Select Ticket Tier</Label>
                {ticketTypes.map(ticket => {
                  const available = ticket.quantity_total - ticket.quantity_sold;
                  const isSoldOut = available <= 0;
                  
                  return (
                    <div 
                      key={ticket.id}
                      onClick={() => !isSoldOut && setSelectedTicketId(ticket.id)}
                      className={`
                        p-4 rounded-xl border-2 flex items-start justify-between cursor-pointer transition-all
                        ${selectedTicketId === ticket.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                        ${isSoldOut ? 'opacity-50 cursor-not-allowed grayscale' : ''}
                      `}
                    >
                      <div>
                        <div className="font-semibold flex items-center gap-2">
                          {ticket.name}
                          {isSoldOut && <span className="text-xs bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full">Sold Out</span>}
                        </div>
                        {ticket.description && (
                          <div className="text-xs text-muted-foreground mt-1">{ticket.description}</div>
                        )}
                      </div>
                      <div className="font-bold whitespace-nowrap ml-4">
                        {Number(ticket.price) === 0 ? 'Free' : `Rs. ${Number(ticket.price).toLocaleString()}`}
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedTicket && (
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl mb-4">
                  <Label className="mb-0">Quantity</Label>
                  <div className="flex items-center gap-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8 rounded-full"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="font-medium w-4 text-center">{quantity}</span>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8 rounded-full"
                      onClick={() => setQuantity(Math.min((selectedTicket.quantity_total - selectedTicket.quantity_sold), quantity + 1))}
                      disabled={quantity >= (selectedTicket.quantity_total - selectedTicket.quantity_sold)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  required 
                  placeholder="Jane Doe" 
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
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
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              
              <div className="flex justify-between items-center py-4 border-t border-border mt-4">
                <div className="text-sm text-muted-foreground">Total</div>
                <div className="text-xl font-bold">
                  {selectedTicket && Number(selectedTicket.price) > 0 
                    ? `Rs. ${(Number(selectedTicket.price) * quantity).toLocaleString()}`
                    : 'Free'
                  }
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsOpen(false)} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={loading || !selectedTicket}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Ticket className="w-4 h-4 mr-2" />}
                  Checkout
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
