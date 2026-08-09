"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus, Loader2, Megaphone, Pin } from "lucide-react";
import { toast } from "sonner";

export default function UpdatesPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  
  const [message, setMessage] = useState("");
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    async function fetchUpdates() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("event_updates")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Failed to load updates");
      } else {
        setUpdates(data || []);
      }
      setLoading(false);
    }
    fetchUpdates();
  }, [eventId]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!message) return;
    setAdding(true);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("event_updates")
      .insert({
        event_id: eventId,
        message,
        is_pinned: isPinned,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to post update");
    } else {
      toast.success("Update posted!");
      setUpdates([data, ...updates]);
      setMessage("");
      setIsPinned(false);
    }
    setAdding(false);
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("event_updates").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete update");
    } else {
      toast.success("Update removed");
      setUpdates(updates.filter(u => u.id !== id));
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold font-display tracking-tight flex items-center gap-2">
          <Megaphone className="w-6 h-6" /> Live Updates
        </h2>
        <p className="text-muted-foreground mt-1">Post real-time announcements to your event page.</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">Announcement Message</Label>
            <Textarea 
              id="message" 
              required
              placeholder="e.g. Doors are open! Head to the main entrance..." 
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox id="pinned" checked={isPinned} onCheckedChange={(c) => setIsPinned(c as boolean)} />
            <Label htmlFor="pinned" className="font-normal cursor-pointer flex items-center gap-1">
              Pin to top <Pin className="w-3 h-3 text-muted-foreground" />
            </Label>
          </div>

          <Button type="submit" disabled={adding} className="w-full sm:w-auto">
            {adding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            Post Update
          </Button>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Recent Updates</h3>
        {updates.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-border rounded-xl text-muted-foreground">
            No updates posted yet.
          </div>
        ) : (
          <div className="space-y-3">
            {updates.map((update) => (
              <div key={update.id} className="flex gap-4 p-4 rounded-xl border border-border bg-card shadow-sm items-start">
                <div className="flex-1">
                  {update.is_pinned && <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full mb-2"><Pin className="w-3 h-3" /> Pinned</span>}
                  <p className="text-foreground whitespace-pre-wrap">{update.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(update.created_at).toLocaleString()}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(update.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
