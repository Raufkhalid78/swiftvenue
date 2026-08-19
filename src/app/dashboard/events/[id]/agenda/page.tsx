"use client";

import { useEffect, useState, use, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Clock, Trash2, Edit2, MapPin, User, Calendar, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface AgendaItem {
  id: string;
  title: string;
  speaker_name?: string | null;
  start_time: string;
  end_time?: string | null;
  description?: string | null;
  day_number: number;
  location_room?: string | null;
  capacity?: number | null;
  order_index?: number;
}

export default function AgendaPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const [items, setItems] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState<number>(1);
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    speaker_name: "",
    start_time: "09:00",
    end_time: "10:00",
    description: "",
    day_number: 1,
    location_room: "",
    capacity: "",
  });

  useEffect(() => {
    loadAgenda();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  async function loadAgenda() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('agenda_items')
      .select('*')
      .eq('event_id', eventId)
      .order('day_number', { ascending: true })
      .order('start_time', { ascending: true });
    
    if (data) setItems(data);
    setLoading(false);
  }

  // Derive unique day numbers
  const daysList = useMemo(() => {
    const set = new Set<number>([1]);
    items.forEach(it => set.add(it.day_number || 1));
    return Array.from(set).sort((a, b) => a - b);
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter(it => (it.day_number || 1) === activeDay);
  }, [items, activeDay]);

  function handleOpenAdd() {
    setEditingId(null);
    setFormData({
      title: "",
      speaker_name: "",
      start_time: "09:00",
      end_time: "10:00",
      description: "",
      day_number: activeDay,
      location_room: "",
      capacity: "",
    });
    setIsAdding(true);
  }

  function handleEditInit(item: AgendaItem) {
    setEditingId(item.id);
    setFormData({
      title: item.title,
      speaker_name: item.speaker_name || "",
      start_time: item.start_time || "09:00",
      end_time: item.end_time || "",
      description: item.description || "",
      day_number: item.day_number || 1,
      location_room: item.location_room || "",
      capacity: item.capacity ? String(item.capacity) : "",
    });
    setIsAdding(true);
  }

  async function handleSaveItem() {
    if (!formData.title.trim() || !formData.start_time) {
      toast.error("Session Title and Start Time are required");
      return;
    }
    
    const supabase = createClient();
    const payload = {
      event_id: eventId,
      title: formData.title.trim(),
      speaker_name: formData.speaker_name.trim() || null,
      start_time: formData.start_time,
      end_time: formData.end_time || null,
      description: formData.description.trim() || null,
      day_number: Number(formData.day_number) || 1,
      location_room: formData.location_room.trim() || null,
      capacity: formData.capacity ? Number(formData.capacity) : null,
    };

    if (editingId) {
      const { error } = await supabase.from('agenda_items').update(payload).eq('id', editingId);
      if (error) return toast.error("Failed to update session");
      toast.success("Session updated!");
    } else {
      const { error } = await supabase.from('agenda_items').insert([{
        ...payload,
        order_index: items.length
      }]);
      if (error) return toast.error("Failed to add session");
      toast.success("Session added!");
    }

    setIsAdding(false);
    setEditingId(null);
    loadAgenda();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this session from agenda?")) return;
    const supabase = createClient();
    await supabase.from('agenda_items').delete().eq('id', id);
    toast.success("Session deleted");
    loadAgenda();
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold font-display">Multi-Day Agenda & Tracks</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Build schedule timelines across multi-day conferences, workshops, and rooms.
          </p>
        </div>
        <Button onClick={handleOpenAdd} className="gap-2">
          <PlusCircle className="w-4 h-4" /> Add Session
        </Button>
      </div>

      {/* Multi-Day Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto">
        {daysList.map(dayNum => (
          <button
            key={dayNum}
            onClick={() => setActiveDay(dayNum)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeDay === dayNum 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            Day {dayNum}
          </button>
        ))}
        <button
          onClick={() => {
            const nextDay = Math.max(...daysList) + 1;
            setActiveDay(nextDay);
            setFormData(prev => ({ ...prev, day_number: nextDay }));
            setIsAdding(true);
          }}
          className="px-3 py-2 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 transition-colors border border-dashed border-primary/40 flex items-center gap-1"
        >
          <PlusCircle className="w-3.5 h-3.5" /> New Day
        </button>
      </div>

      {/* Editor Modal / Form */}
      {isAdding && (
        <div className="p-6 border border-border bg-card rounded-2xl shadow-sm space-y-6 animate-in fade-in zoom-in-95">
          <h3 className="text-lg font-semibold border-b border-border pb-3">
            {editingId ? 'Edit Session' : `New Session (Day ${formData.day_number})`}
          </h3>
          
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-2">
              <Label>Session Title</Label>
              <Input 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})} 
                placeholder="e.g. Keynote: The Future of Cloud" 
              />
            </div>

            <div className="space-y-2">
              <Label>Day Number</Label>
              <Input 
                type="number" 
                min="1" 
                value={formData.day_number} 
                onChange={(e) => setFormData({...formData, day_number: Number(e.target.value)})} 
              />
            </div>

            <div className="space-y-2">
              <Label>Speaker / Host (Optional)</Label>
              <Input 
                value={formData.speaker_name} 
                onChange={(e) => setFormData({...formData, speaker_name: e.target.value})} 
                placeholder="e.g. Dr. Alex Vance" 
              />
            </div>

            <div className="space-y-2">
              <Label>Room / Stage (Optional)</Label>
              <Input 
                value={formData.location_room} 
                onChange={(e) => setFormData({...formData, location_room: e.target.value})} 
                placeholder="e.g. Grand Ballroom B" 
              />
            </div>

            <div className="space-y-2">
              <Label>Capacity Limit (Optional)</Label>
              <Input 
                type="number" 
                min="1" 
                value={formData.capacity} 
                onChange={(e) => setFormData({...formData, capacity: e.target.value})} 
                placeholder="Unlimited" 
              />
            </div>

            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input 
                type="time" 
                value={formData.start_time} 
                onChange={(e) => setFormData({...formData, start_time: e.target.value})} 
              />
            </div>

            <div className="space-y-2">
              <Label>End Time (Optional)</Label>
              <Input 
                type="time" 
                value={formData.end_time} 
                onChange={(e) => setFormData({...formData, end_time: e.target.value})} 
              />
            </div>

            <div className="sm:col-span-2 md:col-span-3 space-y-2">
              <Label>Description / Abstract (Optional)</Label>
              <Textarea 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})} 
                placeholder="What topics will be covered in this session?" 
                rows={3} 
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
            <Button onClick={handleSaveItem}>Save Session</Button>
          </div>
        </div>
      )}

      {/* Timeline List */}
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ) : filteredItems.length === 0 && !isAdding ? (
          <div className="p-12 text-center border border-dashed border-border rounded-2xl bg-card">
            <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <h3 className="font-medium text-lg">No sessions for Day {activeDay}</h3>
            <p className="text-muted-foreground text-sm mb-4">Add your keynote, breakout rooms, or lunch breaks.</p>
            <Button onClick={handleOpenAdd} variant="outline">Add First Session</Button>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div 
              key={item.id}
              className="p-5 bg-card border border-border rounded-2xl shadow-sm hover:border-primary/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 text-primary rounded-xl flex flex-col items-center justify-center min-w-[70px]">
                  <Clock className="w-4 h-4 mb-1" />
                  <span className="text-xs font-bold font-mono">{item.start_time}</span>
                  {item.end_time && <span className="text-[10px] text-muted-foreground font-mono">{item.end_time}</span>}
                </div>

                <div className="space-y-1">
                  <h4 className="text-base font-bold text-foreground">{item.title}</h4>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {item.speaker_name && (
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-primary" /> {item.speaker_name}
                      </span>
                    )}
                    {item.location_room && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-indigo-500" /> {item.location_room}
                      </span>
                    )}
                    {item.capacity && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-amber-500" /> Capacity: {item.capacity}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-1 max-w-xl line-clamp-2">{item.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 self-end md:self-center">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => handleEditInit(item)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
