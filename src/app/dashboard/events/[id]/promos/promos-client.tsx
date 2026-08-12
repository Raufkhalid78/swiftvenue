'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus, Trash2, Tag, Percent, HandCoins } from 'lucide-react';
import { toast } from 'sonner';
import { createPromoCode, deletePromoCode, togglePromoCodeStatus } from './actions';
import { Badge } from '@/components/ui/badge';

interface PromoClientProps {
  eventId: string;
  initialPromos: any[];
}

export function PromosClient({ eventId, initialPromos }: PromoClientProps) {
  const [promos, setPromos] = useState(initialPromos);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage',
    discount_amount: '',
    max_uses: ''
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    
    try {
      await createPromoCode(eventId, {
        code: formData.code,
        discount_type: formData.discount_type,
        discount_amount: Number(formData.discount_amount),
        max_uses: formData.max_uses ? Number(formData.max_uses) : null
      });
      
      toast.success('Promo code created');
      setIsOpen(false);
      setFormData({ code: '', discount_type: 'percentage', discount_amount: '', max_uses: '' });
      // We rely on next.js router to refresh or we can manually refetch. 
      // The server action revalidates the path, but since we use local state here initially, 
      // let's just refresh the window for simplicity, or we should have used router.refresh().
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Promo Code</DialogTitle>
              <DialogDescription>Create a discount code for your event.</DialogDescription>
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
              <div className="grid grid-cols-2 gap-4">
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
              <div className="space-y-2">
                <Label>Max Uses (Optional)</Label>
                <Input 
                  type="number" 
                  min="1"
                  placeholder="Leave empty for unlimited"
                  value={formData.max_uses} 
                  onChange={e => setFormData({...formData, max_uses: e.target.value})} 
                />
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
              <TableHead>Uses</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {promos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No promo codes created yet.
                </TableCell>
              </TableRow>
            ) : (
              promos.map(promo => (
                <TableRow key={promo.id}>
                  <TableCell className="font-bold tracking-wide">{promo.code}</TableCell>
                  <TableCell>
                    {promo.discount_type === 'percentage' 
                      ? <Badge variant="secondary"><Percent className="w-3 h-3 mr-1"/> {promo.discount_amount}%</Badge>
                      : <Badge variant="secondary"><HandCoins className="w-3 h-3 mr-1"/> {promo.discount_amount} OFF</Badge>
                    }
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
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
