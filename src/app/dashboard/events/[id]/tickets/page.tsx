"use client";

import { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Trash2, Edit2, GripVertical, TicketIcon, Ban, CheckCircle2, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface CustomQuestion {
  id: string;
  label: string;
  type: 'text' | 'select' | 'checkbox' | 'number';
  options?: string[];
  required: boolean;
}

interface TicketType {
  id: string;
  name: string;
  description: string | null;
  price: number;
  quantity_total: number;
  quantity_sold: number;
  sales_start: string | null;
  sales_end: string | null;
  is_active: boolean;
  order_index: number;
  waitlist_count?: number;
  custom_questions?: CustomQuestion[];
}

function SortableTicketItem({ 
  item, 
  onEdit, 
  onToggleActive, 
  onDelete 
}: { 
  item: TicketType, 
  onEdit: (item: TicketType) => void,
  onToggleActive: (item: TicketType) => void,
  onDelete: (item: TicketType) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  const percentSold = item.quantity_total > 0 ? (item.quantity_sold / item.quantity_total) * 100 : 0;

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`flex gap-4 p-4 rounded-xl border ${item.is_active ? 'border-border bg-card' : 'border-dashed border-border/50 bg-muted/30'} shadow-sm group transition-all`}
    >
      <div 
        {...attributes} 
        {...listeners} 
        className="flex flex-col items-center justify-center text-muted-foreground/50 cursor-grab active:cursor-grabbing px-2"
      >
        <GripVertical className="w-5 h-5" />
      </div>
      
      <div className="flex-1 space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <h4 className={`font-bold ${!item.is_active && 'text-muted-foreground line-through'}`}>{item.name}</h4>
              {!item.is_active && <span className="text-[10px] uppercase tracking-wider font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Inactive</span>}
            </div>
            {item.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{item.description}</p>}
          </div>
          <div className="text-right">
            <div className="font-bold">{item.price === 0 ? 'Free' : `PKR ${item.price.toLocaleString()}`}</div>
          </div>
        </div>

        {/* Progress Bar & Sales Info */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span>{item.quantity_sold} / {item.quantity_total} sold</span>
              {(item.waitlist_count || 0) > 0 && (
                <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {item.waitlist_count} waiting
                </span>
              )}
            </div>
            <span>{Math.round(percentSold)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div 
              className="bg-primary h-2 rounded-full transition-all" 
              style={{ width: `${Math.min(percentSold, 100)}%` }}
            />
          </div>
          
          {(item.sales_start || item.sales_end) && (
            <div className="text-xs text-muted-foreground pt-1 flex gap-2">
              {item.sales_start && <span>Starts: {new Date(item.sales_start).toLocaleString()}</span>}
              {item.sales_end && <span>Ends: {new Date(item.sales_end).toLocaleString()}</span>}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => onEdit(item)}>
          <Edit2 className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted" onClick={() => onToggleActive(item)} title={item.is_active ? "Deactivate" : "Reactivate"}>
          {item.is_active ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => onDelete(item)}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default function TicketsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<TicketType>>({
    name: "",
    description: "",
    price: 0,
    quantity_total: 100,
    sales_start: "",
    sales_end: "",
    custom_questions: []
  });

  const [newQuestion, setNewQuestion] = useState<{
    label: string;
    type: 'text' | 'select' | 'checkbox' | 'number';
    optionsString: string;
    required: boolean;
  }>({
    label: "",
    type: "text",
    optionsString: "",
    required: false
  });

  const addCustomQuestion = () => {
    if (!newQuestion.label.trim()) return toast.error("Question label is required");
    const options = newQuestion.type === 'select'
      ? newQuestion.optionsString.split(',').map(s => s.trim()).filter(Boolean)
      : undefined;

    const question: CustomQuestion = {
      id: crypto.randomUUID(),
      label: newQuestion.label.trim(),
      type: newQuestion.type,
      options,
      required: newQuestion.required,
    };

    setFormData(prev => ({
      ...prev,
      custom_questions: [...(prev.custom_questions || []), question]
    }));

    setNewQuestion({ label: "", type: "text", optionsString: "", required: false });
  };

  const removeCustomQuestion = (qId: string) => {
    setFormData(prev => ({
      ...prev,
      custom_questions: (prev.custom_questions || []).filter(q => q.id !== qId)
    }));
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedParams.id]);

  async function fetchTickets() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('ticket_types')
      .select('*')
      .eq('event_id', resolvedParams.id)
      .order('order_index', { ascending: true });
    
    if (data && data.length > 0) {
      const { data: waitlistCounts } = await supabase
        .from('waitlists')
        .select('ticket_type_id')
        .eq('status', 'waiting')
        .in('ticket_type_id', data.map((t: any) => t.id));

      const countByTier = waitlistCounts?.reduce((acc: any, w: any) => {
        acc[w.ticket_type_id] = (acc[w.ticket_type_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const enhancedData = data.map((t: any) => ({
        ...t,
        waitlist_count: countByTier[t.id] || 0
      }));
      setTickets(enhancedData);
    } else {
      if (data) setTickets(data);
    }
    setLoading(false);
  }

  async function handleSave() {
    if (!formData.name) return toast.error("Ticket name is required");
    if (formData.price === undefined || formData.price < 0) return toast.error("Valid price is required");
    if (!formData.quantity_total || formData.quantity_total <= 0) return toast.error("Total quantity must be greater than 0");

    const supabase = createClient();
    const payload = {
      ...formData,
      sales_start: formData.sales_start || null,
      sales_end: formData.sales_end || null,
      custom_questions: formData.custom_questions || [],
    };

    if (editingId) {
      const { error } = await supabase.from('ticket_types').update(payload).eq('id', editingId);
      if (error) return toast.error('Failed to update ticket type');
      toast.success('Ticket type updated');
    } else {
      const { error } = await supabase.from('ticket_types').insert({
        ...payload, 
        event_id: resolvedParams.id, 
        quantity_sold: 0, 
        order_index: tickets.length,
        is_active: true
      });
      if (error) return toast.error('Failed to create ticket type');
      toast.success('Ticket type added');
    }
    
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: "", description: "", price: 0, quantity_total: 100, sales_start: "", sales_end: "", custom_questions: [] });
    fetchTickets();
  }

  function handleEditInit(item: TicketType) {
    setFormData({
      name: item.name,
      description: item.description || "",
      price: item.price,
      quantity_total: item.quantity_total,
      sales_start: item.sales_start ? new Date(item.sales_start).toISOString().slice(0, 16) : "",
      sales_end: item.sales_end ? new Date(item.sales_end).toISOString().slice(0, 16) : "",
      custom_questions: item.custom_questions || [],
    });
    setEditingId(item.id);
    setIsAdding(true);
  }

  async function handleToggleActive(ticket: TicketType) {
    const supabase = createClient();
    const { error } = await supabase.from('ticket_types').update({ is_active: !ticket.is_active }).eq('id', ticket.id);
    if (error) return toast.error('Failed to update ticket state');
    toast.success(ticket.is_active ? 'Ticket type deactivated' : 'Ticket type reactivated');
    fetchTickets();
  }

  async function handleDelete(ticket: TicketType) {
    if (ticket.quantity_sold > 0) {
      toast.error('Cannot delete a ticket type with existing sales — deactivate it instead.');
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.from('ticket_types').delete().eq('id', ticket.id);
    if (error) return toast.error('Failed to delete ticket type');
    toast.success('Ticket type deleted');
    fetchTickets();
  }

  async function handleDragEnd(event: any) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = tickets.findIndex((t) => t.id === active.id);
    const newIndex = tickets.findIndex((t) => t.id === over.id);
    
    const newTickets = arrayMove(tickets, oldIndex, newIndex);
    setTickets(newTickets);

    const supabase = createClient();
    const updates = newTickets.map((ticket, index) => ({
      id: ticket.id,
      order_index: index,
    }));

    await Promise.all(
      updates.map(update =>
        supabase.from('ticket_types').update({ order_index: update.order_index }).eq('id', update.id)
      )
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display">Ticket Tiers</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage pricing, inventory, and sales windows.</p>
        </div>
        <Button onClick={() => {
          setEditingId(null);
          setFormData({ name: "", description: "", price: 0, quantity_total: 100, sales_start: "", sales_end: "" });
          setIsAdding(true);
        }} className="gap-2" disabled={isAdding}>
          <PlusCircle className="w-4 h-4" /> Add Ticket Tier
        </Button>
      </div>

      {isAdding && (
        <div className="p-6 border border-border bg-card rounded-xl shadow-sm space-y-6 animate-in fade-in zoom-in-95">
          <h3 className="text-lg font-semibold border-b border-border pb-3">{editingId ? 'Edit Ticket Tier' : 'New Ticket Tier'}</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tier Name</Label>
              <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Early Bird, VIP" />
            </div>
            <div className="space-y-2">
              <Label>Price (PKR) - 0 for Free</Label>
              <Input type="number" min="0" value={formData.price} onChange={(e) => setFormData({...formData, price: Number(e.target.value)})} />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label>Description (Optional)</Label>
              <Textarea value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="What does this ticket include?" rows={2} />
            </div>

            <div className="space-y-2">
              <Label>Total Quantity Available</Label>
              <Input type="number" min="1" value={formData.quantity_total} onChange={(e) => setFormData({...formData, quantity_total: Number(e.target.value)})} />
            </div>
            <div className="space-y-2">
              {/* Empty space for layout balance */}
            </div>

            <div className="space-y-2">
              <Label>Sales Start (Optional)</Label>
              <Input type="datetime-local" value={formData.sales_start || ''} onChange={(e) => setFormData({...formData, sales_start: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Sales End (Optional)</Label>
              <Input type="datetime-local" value={formData.sales_end || ''} onChange={(e) => setFormData({...formData, sales_end: e.target.value})} />
            </div>

            {/* Custom Registration Questions Builder */}
            <div className="md:col-span-2 pt-4 border-t border-border space-y-4">
              <div>
                <Label className="text-sm font-semibold">Custom Attendee Questions (Optional)</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Collect attendee intake information during checkout (e.g. Dietary preferences, T-shirt size, Job title).</p>
              </div>

              {/* Configured questions list */}
              {formData.custom_questions && formData.custom_questions.length > 0 && (
                <div className="space-y-2">
                  {formData.custom_questions.map((q, idx) => (
                    <div key={q.id || idx} className="flex items-center justify-between p-3 bg-muted/40 border border-border rounded-lg text-sm">
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {q.label}
                          {q.required && <span className="text-[10px] uppercase font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded">Required</span>}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Type: {q.type.toUpperCase()} {q.options?.length ? `• Options: [${q.options.join(', ')}]` : ''}
                        </div>
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => removeCustomQuestion(q.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* New question inputs */}
              <div className="p-3.5 bg-muted/20 border border-border/70 rounded-xl space-y-3">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Add a Question</div>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-xs">Question Label</Label>
                    <Input 
                      placeholder="e.g. T-Shirt Size or Company Name"
                      value={newQuestion.label}
                      onChange={e => setNewQuestion(prev => ({ ...prev, label: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Field Type</Label>
                    <select
                      className="w-full h-8 text-xs bg-background border border-border rounded-md px-2"
                      value={newQuestion.type}
                      onChange={e => setNewQuestion(prev => ({ ...prev, type: e.target.value as any }))}
                    >
                      <option value="text">Text Input</option>
                      <option value="select">Dropdown Select</option>
                      <option value="checkbox">Checkbox (Yes/No)</option>
                      <option value="number">Number</option>
                    </select>
                  </div>
                </div>

                {newQuestion.type === 'select' && (
                  <div className="space-y-1">
                    <Label className="text-xs">Options (comma-separated)</Label>
                    <Input 
                      placeholder="Small, Medium, Large, XL"
                      value={newQuestion.optionsString}
                      onChange={e => setNewQuestion(prev => ({ ...prev, optionsString: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={newQuestion.required}
                      onChange={e => setNewQuestion(prev => ({ ...prev, required: e.target.checked }))}
                      className="rounded border-border"
                    />
                    Required field
                  </label>
                  <Button type="button" size="sm" variant="secondary" className="h-7 text-xs gap-1" onClick={addCustomQuestion}>
                    <PlusCircle className="w-3.5 h-3.5" /> Add Question
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Ticket Tier</Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ) : tickets.length === 0 && !isAdding ? (
          <div className="p-12 text-center border border-dashed border-border rounded-xl bg-card">
            <TicketIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <h3 className="font-medium text-lg">No tickets created</h3>
            <p className="text-muted-foreground mb-4">Create your first ticket tier to start selling.</p>
            <Button onClick={() => setIsAdding(true)} variant="outline">Add Ticket Tier</Button>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={tickets.map(t => t.id)} strategy={verticalListSortingStrategy}>
              {tickets.map((ticket) => (
                <SortableTicketItem 
                  key={ticket.id} 
                  item={ticket} 
                  onEdit={handleEditInit}
                  onToggleActive={handleToggleActive}
                  onDelete={handleDelete}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
