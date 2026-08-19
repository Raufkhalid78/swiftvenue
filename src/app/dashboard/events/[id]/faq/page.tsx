"use client";

import { useEffect, useState, use } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Trash2, Edit2, GripVertical, HelpCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function FAQPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState({ question: "", answer: "" });

  useEffect(() => {
    loadFAQs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedParams.id]);

  async function loadFAQs() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('event_faqs')
      .select('*')
      .eq('event_id', resolvedParams.id)
      .order('order_index', { ascending: true });
    
    if (data) setItems(data);
    setLoading(false);
  }

  async function handleAddItem() {
    if (!newItem.question || !newItem.answer) {
      toast.error("Question and Answer are required");
      return;
    }
    
    const supabase = createClient();
    const { error } = await supabase.from('event_faqs').insert([{
      event_id: resolvedParams.id,
      ...newItem,
      order_index: items.length
    }]);

    if (error) {
      toast.error("Failed to add FAQ");
    } else {
      toast.success("FAQ added!");
      setIsAdding(false);
      setNewItem({ question: "", answer: "" });
      loadFAQs();
    }
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from('event_faqs').delete().eq('id', id);
    toast.success("FAQ deleted");
    loadFAQs();
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display">Frequently Asked Questions</h2>
          <p className="text-sm text-muted-foreground mt-1">Help attendees by answering common questions in advance.</p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="gap-2" disabled={isAdding}>
          <PlusCircle className="w-4 h-4" /> Add FAQ
        </Button>
      </div>

      {isAdding && (
        <div className="p-6 border border-primary/50 bg-primary/5 rounded-xl space-y-4 animate-in fade-in zoom-in-95">
          <h3 className="font-medium">New FAQ</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Question</Label>
              <Input value={newItem.question} onChange={(e) => setNewItem({...newItem, question: e.target.value})} placeholder="e.g. Is parking available?" />
            </div>
            <div className="space-y-2">
              <Label>Answer</Label>
              <Textarea value={newItem.answer} onChange={(e) => setNewItem({...newItem, answer: e.target.value})} placeholder="Yes, there is a paid parking structure..." />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
            <Button onClick={handleAddItem}>Save FAQ</Button>
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
            <HelpCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <h3 className="font-medium text-lg">No FAQs yet</h3>
            <p className="text-muted-foreground mb-4">Add some questions and answers to help your attendees.</p>
            <Button onClick={() => setIsAdding(true)} variant="outline">Add First FAQ</Button>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex gap-4 p-4 rounded-xl border border-border bg-card shadow-sm hover:border-primary/30 transition-colors group">
              <div className="flex flex-col items-center justify-center text-muted-foreground/50 cursor-grab px-2">
                <GripVertical className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold">{item.question}</h4>
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{item.answer}</p>
              </div>
              <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Edit2 className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(item.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
