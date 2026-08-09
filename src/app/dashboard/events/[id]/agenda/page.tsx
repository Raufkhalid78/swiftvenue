"use client";

import { useEffect, useState, use } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Clock, Trash2, Edit2, GripVertical, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function AgendaPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Quick hacky inline form state for demo
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState({ title: "", start_time: "", end_time: "", description: "", speaker_name: "" });

  useEffect(() => {
    loadAgenda();
   
  }, [resolvedParams.id]);

  async function loadAgenda() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('agenda_items')
      .select('*')
      .eq('event_id', resolvedParams.id)
      .order('order_index', { ascending: true });
    
    if (data) setItems(data);
    setLoading(false);
  }

  async function handleAddItem() {
    if (!newItem.title || !newItem.start_time) {
      toast.error("Title and Start Time are required");
      return;
    }
    
    const supabase = createClient();
    const { error } = await supabase.from('agenda_items').insert([{
      event_id: resolvedParams.id,
      ...newItem,
      order_index: items.length
    }]);

    if (error) {
      toast.error("Failed to add agenda item");
    } else {
      toast.success("Agenda item added!");
      setIsAdding(false);
      setNewItem({ title: "", start_time: "", end_time: "", description: "", speaker_name: "" });
      loadAgenda();
    }
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from('agenda_items').delete().eq('id', id);
    toast.success("Item deleted");
    loadAgenda();
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display">Event Schedule & Agenda</h2>
          <p className="text-sm text-muted-foreground mt-1">Build out your event timeline. This will be visible on the public page.</p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="gap-2" disabled={isAdding}>
          <PlusCircle className="w-4 h-4" /> Add Item
        </Button>
      </div>

      {isAdding && (
        <div className="p-6 border border-primary/50 bg-primary/5 rounded-xl space-y-4 animate-in fade-in zoom-in-95">
          <h3 className="font-medium">New Agenda Item</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Session Title</Label>
              <Input value={newItem.title} onChange={(e) => setNewItem({...newItem, title: e.target.value})} placeholder="e.g. Opening Keynote" />
            </div>
            <div className="space-y-2">
              <Label>Speaker / Host Name (Optional)</Label>
              <Input value={newItem.speaker_name} onChange={(e) => setNewItem({...newItem, speaker_name: e.target.value})} placeholder="e.g. Jane Doe" />
            </div>
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input type="time" value={newItem.start_time} onChange={(e) => setNewItem({...newItem, start_time: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>End Time (Optional)</Label>
              <Input type="time" value={newItem.end_time} onChange={(e) => setNewItem({...newItem, end_time: e.target.value})} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <Textarea value={newItem.description} onChange={(e) => setNewItem({...newItem, description: e.target.value})} placeholder="Brief description of this session..." />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
            <Button onClick={handleAddItem}>Save Item</Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : items.length === 0 && !isAdding ? (
          <div className="p-12 text-center border border-dashed border-border rounded-xl bg-card">
            <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <h3 className="font-medium text-lg">No agenda items yet</h3>
            <p className="text-muted-foreground mb-4">Start building your event schedule so attendees know what to expect.</p>
            <Button onClick={() => setIsAdding(true)} variant="outline">Add First Session</Button>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex gap-4 p-4 rounded-xl border border-border bg-card shadow-sm hover:border-primary/30 transition-colors group">
              <div className="flex flex-col items-center justify-center text-muted-foreground/50 cursor-grab px-2">
                <GripVertical className="w-5 h-5" />
              </div>
              <div className="flex-1 flex flex-col sm:flex-row gap-4 sm:items-center">
                <div className="w-32 shrink-0">
                  <div className="flex items-center gap-1.5 font-medium text-primary bg-primary/10 px-2 py-1 rounded w-max text-sm">
                    <Clock className="w-3.5 h-3.5" />
                    {item.start_time} {item.end_time && `- ${item.end_time}`}
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold">{item.title}</h4>
                  {item.speaker_name && <p className="text-sm font-medium text-muted-foreground mt-0.5">By {item.speaker_name}</p>}
                  {item.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>}
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Edit2 className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(item.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
