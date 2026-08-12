'use client';

import { useState } from 'react';
import { Pencil, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    } catch (err) {
      toast.error('Could not update ticket details');
    } finally {
      setIsSaving(false);
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
                    title="Assign to a different guest"
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
              <div className="shrink-0">
                <WalletButtons attendeeId={a.id} compact />
              </div>
            ) : null}
            
          </div>
        ))}
      </div>
    </div>
  );
}
