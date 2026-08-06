"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function RegistrationWidget({ eventId, eventTitle }: { eventId: string, eventTitle: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "" });

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error("Please fill out all fields.");
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
          amount: 1000 // Fixed ticket price of PKR 1000 for demonstration
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

  return (
    <>
      <div className="p-6 rounded-2xl bg-primary/10 border border-primary/20 text-center">
        <h3 className="font-semibold text-lg mb-2 text-foreground">Secure your spot</h3>
        <p className="text-sm text-muted-foreground mb-4">Tickets for {eventTitle} are available now.</p>
        <Button onClick={() => setIsOpen(true)} className="w-full">
          Get Tickets — Rs. 1000
        </Button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border p-6 animate-in zoom-in-95">
            <h3 className="text-2xl font-bold font-display mb-2">Register for Event</h3>
            <p className="text-muted-foreground mb-6">Enter your details to secure your ticket.</p>
            
            <form onSubmit={handleCheckout} className="space-y-4">
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
              
              <div className="bg-muted p-4 rounded-xl flex justify-between items-center mt-6 mb-6 text-sm font-medium">
                <span>General Admission</span>
                <span>PKR 1,000.00</span>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsOpen(false)} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Pay & Checkout
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
