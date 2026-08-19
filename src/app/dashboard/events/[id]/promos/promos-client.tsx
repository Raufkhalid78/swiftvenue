'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus, Trash2, Percent, HandCoins } from 'lucide-react';
import { toast } from 'sonner';
import { createPromoCode, deletePromoCode, togglePromoCodeStatus } from './actions';
import { Badge } from '@/components/ui/badge';

interface PromoClientProps {
  eventId: string;
  initialPromos: any[];
  ticketTypes?: any[];
}

export function PromosClient({ eventId, initialPromos, ticketTypes = [] }: PromoClientProps) {
  const [promos, setPromos] = useState(initialPromos);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<{
    code: string;
    discount_type: string;
    discount_amount: string;
    max_uses: string;
    applicable_ticket_type_ids: string[];
    min_quantity: string;
    min_order_amount: string;
  }>({
    code: '',
    discount_type: 'percentage',
    discount_amount: '',
    max_uses: '',
    applicable_ticket_type_ids: [],
    min_quantity: '1',
    min_order_amount: '0',
  });

  const toggleTierSelection = (tierId: string) => {
    setFormData(prev => {
      const exists = prev.applicable_ticket_type_ids.includes(tierId);
      return {
        ...prev,
        applicable_ticket_type_ids: exists
          ? prev.applicable_ticket_type_ids.filter(id => id !== tierId)
          : [...prev.applicable_ticket_type_ids, tierId]
      };
    });
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    
    try {
      await createPromoCode(eventId, {
        code: formData.code,
        discount_type: formData.discount_type,
        discount_amount: Number(formData.discount_amount),
        max_uses: formData.max_uses ? Number(formData.max_uses) : null,
        applicable_ticket_type_ids: formData.applicable_ticket_type_ids,
        min_quantity: formData.min_quantity ? Number(formData.min_quantity) : 1,
        min_order_amount: formData.min_order_amount ? Number(formData.min_order_amount) : 0,
      });
      
      toast.success('Promo code created');
      setIsOpen(false);
      setFormData({
        code: '',
        discount_type: 'percentage',
        discount_amount: '',
        max_uses: '',
        applicable_ticket_type_ids: [],
        min_quantity: '1',
        min_order_amount: '0',
      });
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this promo code?')) return;
    try {
      await deletePromoCode(eventId, id);
      setPromos(promos.filter(p => p.id !== id));
      toast.success('Promo code deleted');
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function handleToggle(id: string, currentStatus: boolean) {
    try {
      await togglePromoCodeStatus(eventId, id, currentStatus);
      setPromos(promos.map(p => p.id === id ? { ...p, is_active: !currentStatus } : p));
      toast.success('Promo code status updated');
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2"/> Create Code</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Promo Code</DialogTitle>
              <DialogDescription>Create a targeted or volume discount code for your event.</DialogDescription>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Code (e.g. SUMMER24)</Label>
                <Input 
                  required 
                  value={formData.code} 
                  onChange={e => setFormData({...formData, code: e.target.value.toUpperCase().replace(/\s/g, '')})} 
                  placeholder="EARLYBIRD"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <Select 
                    value={formData.discount_type} 
                    onValueChange={v => setFormData({...formData, discount_type: v})}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Value</Label>
                  <Input 
                    type="number" 
                    required 
                    min="1" 
                    max={formData.discount_type === 'percentage' ? "100" : undefined}
                    value={formData.discount_amount} 
                    onChange={e => setFormData({...formData, discount_amount: e.target.value})} 
                  />
                </div>
              </div>

              {ticketTypes.length > 0 && (
                <div className="space-y-2 border border-border/80 rounded-lg p-3 bg-muted/20">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Applicable Ticket Tiers (Optional)</Label>
                  <p className="text-xs text-muted-foreground mb-2">Leave unselected to apply to all ticket tiers.</p>
                  <div className="flex flex-wrap gap-2">
                    {ticketTypes.map(tier => {
                      const isSelected = formData.applicable_ticket_type_ids.includes(tier.id);
                      return (
                        <button
                          key={tier.id}
                          type="button"
                          onClick={() => toggleTierSelection(tier.id)}
                          className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                            isSelected
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background text-muted-foreground border-border hover:bg-muted'
                          }`}
                        >
                          {tier.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Min Quantity</Label>
                  <Input 
                    type="number" 
                    min="1"
                    placeholder="1"
                    value={formData.min_quantity} 
                    onChange={e => setFormData({...formData, min_quantity: e.target.value})} 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Min Order (Rs)</Label>
                  <Input 
                    type="number" 
                    min="0"
                    placeholder="0"
                    value={formData.min_order_amount} 
                    onChange={e => setFormData({...formData, min_order_amount: e.target.value})} 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Max Uses</Label>
                  <Input 
                    type="number" 
                    min="1"
                    placeholder="∞"
                    value={formData.max_uses} 
                    onChange={e => setFormData({...formData, max_uses: e.target.value})} 
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : "Create Promo Code"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Rules & Tiers</TableHead>
              <TableHead>Uses</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {promos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No promo codes created yet.
                </TableCell>
              </TableRow>
            ) : (
              promos.map(promo => {
                const applicableTiers = promo.applicable_ticket_type_ids && Array.isArray(promo.applicable_ticket_type_ids)
                  ? ticketTypes.filter(t => promo.applicable_ticket_type_ids.includes(t.id)).map(t => t.name)
                  : [];

                return (
                  <TableRow key={promo.id}>
                    <TableCell className="font-bold tracking-wide">{promo.code}</TableCell>
                    <TableCell>
                      {promo.discount_type === 'percentage' 
                        ? <Badge variant="secondary"><Percent className="w-3 h-3 mr-1"/> {promo.discount_amount}%</Badge>
                        : <Badge variant="secondary"><HandCoins className="w-3 h-3 mr-1"/> {promo.discount_amount} OFF</Badge>
                      }
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div className="space-y-1">
                        {applicableTiers.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {applicableTiers.map((t, idx) => (
                              <span key={idx} className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px] font-medium">
                                {t}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/70">All Tiers</span>
                        )}
                        {(promo.min_quantity > 1 || Number(promo.min_order_amount) > 0) && (
                          <div className="text-[10px] text-amber-600 dark:text-amber-400">
                            {promo.min_quantity > 1 && `Min ${promo.min_quantity} tickets `}
                            {Number(promo.min_order_amount) > 0 && `(Min Rs. ${Number(promo.min_order_amount).toLocaleString()})`}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {promo.current_uses} / {promo.max_uses ? promo.max_uses : '∞'}
                    </TableCell>
                    <TableCell>
                      <Switch 
                        checked={promo.is_active} 
                        onCheckedChange={() => handleToggle(promo.id, promo.is_active)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(promo.id)} className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
