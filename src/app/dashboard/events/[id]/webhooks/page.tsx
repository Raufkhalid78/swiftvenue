"use client";

import { use, useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Webhook, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Play, 
  Copy, 
  ExternalLink,
  ShieldCheck,
  Radio
} from "lucide-react";
import { toast } from "sonner";
import { getWebhooks, createWebhook, toggleWebhook, deleteWebhook, sendTestPing } from "./actions";

const AVAILABLE_EVENTS = [
  { id: 'order.paid', label: 'order.paid', desc: 'Triggered when a guest successfully buys tickets' },
  { id: 'attendee.checked_in', label: 'attendee.checked_in', desc: 'Triggered when a ticket is scanned at the venue' },
  { id: 'ticket.transferred', label: 'ticket.transferred', desc: 'Triggered when an attendee reassigns their ticket' },
  { id: 'waitlist.joined', label: 'waitlist.joined', desc: 'Triggered when a user joins the waitlist' },
];

export default function WebhooksPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  const [newUrl, setNewUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['order.paid', 'attendee.checked_in']);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getWebhooks(eventId);
      setWebhooks(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load webhooks");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://')) {
      return toast.error("URL must start with https:// (or http:// for testing)");
    }
    if (selectedEvents.length === 0) {
      return toast.error("Select at least one event trigger");
    }

    setSaving(true);
    try {
      await createWebhook(eventId, { url: newUrl, subscribedEvents: selectedEvents });
      toast.success("Webhook endpoint registered");
      setNewUrl("");
      setIsAdding(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to create webhook");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (wh: any) => {
    try {
      await toggleWebhook(wh.id, eventId, !wh.is_active);
      toast.success(wh.is_active ? "Webhook paused" : "Webhook activated");
      loadData();
    } catch (err: any) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this webhook endpoint?")) return;
    try {
      await deleteWebhook(id, eventId);
      toast.success("Webhook deleted");
      loadData();
    } catch (err: any) {
      toast.error("Failed to delete webhook");
    }
  };

  const handleTestPing = async (id: string) => {
    try {
      toast.info("Sending test payload...");
      await sendTestPing(id, eventId);
      toast.success("Test ping dispatched! Refresh logs in a moment.");
      setTimeout(loadData, 1500);
    } catch (err: any) {
      toast.error("Failed to send test ping");
    }
  };

  const copySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    toast.success("Signing secret copied to clipboard");
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold font-display flex items-center gap-2">
            <Webhook className="w-5 h-5 text-primary" /> Outbound Webhooks
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Stream real-time event updates to Zapier, Make, Slack, or custom backends.
          </p>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Webhook
        </Button>
      </div>

      {isAdding && (
        <Card className="border-border shadow-sm animate-in fade-in zoom-in-95">
          <CardHeader>
            <CardTitle className="text-lg">New Webhook Endpoint</CardTitle>
            <CardDescription>We will send JSON POST requests with HMAC SHA-256 signatures.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">Destination Endpoint URL</Label>
                <Input
                  id="url"
                  placeholder="https://api.myapp.com/webhooks/swiftvenue"
                  value={newUrl}
                  onChange={e => setNewUrl(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Event Triggers</Label>
                <div className="grid sm:grid-cols-2 gap-3 pt-1">
                  {AVAILABLE_EVENTS.map(ev => (
                    <label 
                      key={ev.id} 
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        selectedEvents.includes(ev.id) ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-muted/30'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedEvents.includes(ev.id)}
                        onChange={e => {
                          if (e.target.checked) setSelectedEvents(prev => [...prev, ev.id]);
                          else setSelectedEvents(prev => prev.filter(x => x !== ev.id));
                        }}
                        className="mt-1 rounded border-border"
                      />
                      <div>
                        <div className="font-mono text-xs font-semibold">{ev.label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{ev.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Creating..." : "Save Endpoint"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      ) : webhooks.length === 0 && !isAdding ? (
        <Card className="p-12 text-center border-dashed border-border bg-card">
          <Webhook className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <h3 className="font-medium text-lg">No webhooks configured</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto mb-4">
            Connect SwiftVenue with Zapier or your internal CRM to automate ticket notifications and guest check-in workflows.
          </p>
          <Button variant="outline" onClick={() => setIsAdding(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Create First Endpoint
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {webhooks.map((wh) => (
            <Card key={wh.id} className="border-border shadow-sm overflow-hidden">
              <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 bg-muted/10">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${wh.is_active ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                    <span className="font-mono text-sm font-semibold truncate text-foreground">{wh.url}</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {wh.is_active ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {(wh.subscribed_events || []).map((ev: string) => (
                      <span key={ev} className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                        {ev}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={() => handleTestPing(wh.id)}>
                    <Play className="w-3.5 h-3.5 text-emerald-600" /> Send Test
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={() => handleToggle(wh)}>
                    {wh.is_active ? "Pause" : "Resume"}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(wh.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-card grid md:grid-cols-3 gap-4 text-xs">
                <div>
                  <div className="text-muted-foreground font-medium mb-1 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Signing Secret
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="font-mono bg-muted px-2 py-1 rounded text-[11px] text-muted-foreground">
                      {wh.secret ? `${wh.secret.slice(0, 10)}...` : 'whsec_••••••••'}
                    </code>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copySecret(wh.secret)} title="Copy Secret">
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <div className="text-muted-foreground font-medium mb-1.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Recent Deliveries
                  </div>
                  {wh.webhook_deliveries && wh.webhook_deliveries.length > 0 ? (
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {wh.webhook_deliveries.slice(0, 3).map((del: any) => (
                        <div key={del.id} className="flex items-center justify-between p-1.5 bg-muted/30 rounded border border-border/50 text-[11px]">
                          <div className="flex items-center gap-2">
                            {del.status === 'success' ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-rose-500" />
                            )}
                            <span className="font-mono font-medium">{del.event_type}</span>
                            <span className="text-muted-foreground">({del.duration_ms}ms)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`font-mono px-1.5 py-0.2 rounded ${del.response_code >= 200 && del.response_code < 300 ? 'text-emerald-600 bg-emerald-500/10' : 'text-rose-600 bg-rose-500/10'}`}>
                              HTTP {del.response_code}
                            </span>
                            <span className="text-muted-foreground">{new Date(del.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">No deliveries recorded yet.</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
