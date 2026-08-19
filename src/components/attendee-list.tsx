'use client';

import { useState } from 'react';
import { Pencil, Check, X, Loader2, Send, Copy, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { WalletButtons } from '@/components/wallet-buttons';
import { toast } from 'sonner';

interface Attendee {
  id: string;
  guest_name: string;
  guest_email: string;
}

export function AttendeeList({ initialAttendees }: { initialAttendees: Attendee[] }) {
  const [attendees, setAttendees] = useState<Attendee[]>(initialAttendees);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Transfer modal state
  const [transferAttendee, setTransferAttendee] = useState<Attendee | null>(null);
  const [transferEmail, setTransferEmail] = useState('');
  const [transferName, setTransferName] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [generatedClaimUrl, setGeneratedClaimUrl] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState(false);

  const startEdit = (a: Attendee) => {
    setEditingId(a.id);
    setEditName(a.guest_name || '');
    setEditEmail(a.guest_email || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: string) => {
    if (!editName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    
    setIsSaving(true);
    try {
      const res = await fetch(`/api/attendees/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guest_name: editName, guest_email: editEmail }),
      });
      
      if (!res.ok) throw new Error('Failed to update ticket');
      
      setAttendees(attendees.map(a => a.id === id ? { ...a, guest_name: editName, guest_email: editEmail } : a));
      toast.success('Ticket updated successfully!');
      setEditingId(null);
    } catch {
      toast.error('Could not update ticket details');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferAttendee || !transferEmail.trim()) return;

    setIsTransferring(true);
    try {
      const res = await fetch(`/api/attendees/${transferAttendee.id}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: transferEmail.trim(),
          recipientName: transferName.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initiate transfer');

      setGeneratedClaimUrl(data.claimUrl);
      toast.success(`Transfer invitation sent to ${transferEmail}!`);
    } catch (err: any) {
      toast.error(err.message || 'Transfer failed');
    } finally {
      setIsTransferring(false);
    }
  };

  const copyClaimLink = () => {
    if (generatedClaimUrl) {
      navigator.clipboard.writeText(generatedClaimUrl);
      setHasCopied(true);
      toast.success('Claim link copied to clipboard!');
      setTimeout(() => setHasCopied(false), 2500);
    }
  };

  return (
    <div className="text-left">
      <h3 className="font-semibold mb-4">Your {attendees.length} tickets:</h3>
      <div className="space-y-3">
        {attendees.map((a, index) => (
          <div key={a.id} className="border border-border rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20">
            
            {editingId === a.id ? (
              <div className="flex-1 space-y-2">
                <Input 
                  value={editName} 
                  onChange={e => setEditName(e.target.value)} 
                  placeholder="Guest Name" 
                  className="h-8 text-sm"
                  autoFocus
                />
                <Input 
                  value={editEmail} 
                  onChange={e => setEditEmail(e.target.value)} 
                  placeholder="Guest Email (optional)" 
                  type="email"
                  className="h-8 text-sm"
                />
                <div className="flex items-center gap-2 pt-1">
                  <Button size="sm" className="h-7 text-xs gap-1" onClick={() => saveEdit(a.id)} disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Save
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={cancelEdit} disabled={isSaving}>
                    <X className="w-3 h-3" /> Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{a.guest_name}</span>
                  <button 
                    onClick={() => startEdit(a)}
                    className="text-muted-foreground hover:text-primary transition-colors p-1"
                    title="Edit name directly"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  Ticket #{index + 1} {a.guest_email && `• ${a.guest_email}`}
                </div>
              </div>
            )}

            {!editingId || editingId !== a.id ? (
              <div className="flex items-center gap-2 shrink-0">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setTransferAttendee(a);
                    setTransferEmail('');
                    setTransferName('');
                    setGeneratedClaimUrl(null);
                  }}
                >
                  <Send className="w-3 h-3" /> Transfer
                </Button>
                <WalletButtons attendeeId={a.id} compact />
              </div>
            ) : null}
            
          </div>
        ))}
      </div>

      {/* Transfer Dialog */}
      <Dialog open={!!transferAttendee} onOpenChange={open => !open && setTransferAttendee(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Transfer Ticket</DialogTitle>
            <DialogDescription>
              Send this ticket to a friend or colleague. They will receive a unique claim link to claim and personalize their ticket.
            </DialogDescription>
          </DialogHeader>

          {generatedClaimUrl ? (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-300">
                ✓ An email invitation was sent! You can also copy and share the direct claim link below:
              </div>
              <div className="flex gap-2">
                <Input value={generatedClaimUrl} readOnly className="text-xs font-mono bg-muted" />
                <Button size="sm" onClick={copyClaimLink} className="gap-1.5 shrink-0">
                  {hasCopied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {hasCopied ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <Button variant="outline" className="w-full" onClick={() => setTransferAttendee(null)}>
                Done
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSendTransfer} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="recipientEmail">Recipient Email Address</Label>
                <Input 
                  id="recipientEmail" 
                  type="email" 
                  required 
                  placeholder="colleague@example.com"
                  value={transferEmail}
                  onChange={e => setTransferEmail(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="recipientName">Recipient Name (Optional)</Label>
                <Input 
                  id="recipientName" 
                  placeholder="e.g. Alex Smith"
                  value={transferName}
                  onChange={e => setTransferName(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setTransferAttendee(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isTransferring} className="gap-2">
                  {isTransferring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send Transfer Link
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

