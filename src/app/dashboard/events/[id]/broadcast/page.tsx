"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, ArrowLeft, CheckCircle2, XCircle, History } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { OrganizerAiCopilot } from "@/components/organizer-ai-copilot";

export default function BroadcastPage() {
  const params = useParams();
  const eventId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const fetchHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const res = await fetch(`/api/broadcast?eventId=${eventId}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.jobs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) {
      toast.error("Please enter both a subject and message.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, subject, body }),
      });

      const data = await res.json();
      
      if (res.ok) {
        toast.success(`Successfully dispatched broadcast to ${data.count} attendees!`);
        setSubject("");
        setBody("");
        fetchHistory();
      } else {
        toast.error(data.error || "Failed to send broadcast");
      }
    } catch {
      toast.error("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/events/${eventId}`}>
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold font-display">Email Attendees</h1>
          <p className="text-muted-foreground text-sm">Send updates, venue directions, or important information to registered guests.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle>New Broadcast Message</CardTitle>
              <CardDescription className="mt-1">
                Emails are sent via secure BCC in rate-limited batches to guarantee 100% inbox delivery.
              </CardDescription>
            </div>
            <OrganizerAiCopilot 
              eventId={eventId} 
              defaultAction="generate_email"
              triggerButtonText="Draft Email with AI"
              onApplyResult={(content) => {
                const subjectMatch = content.match(/Subject:\s*(.*)/i);
                if (subjectMatch && subjectMatch[1]) {
                  setSubject(subjectMatch[1].trim());
                  const cleanedBody = content.replace(/Subject:\s*.*\n*/i, '').trim();
                  setBody(cleanedBody);
                } else {
                  setBody(content);
                }
              }}
            />
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSend} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="subject">Email Subject</Label>
                <Input 
                  id="subject"
                  placeholder="Important: Location change for tomorrow's event"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Message Body</Label>
                <Textarea 
                  id="body"
                  placeholder="Hi everyone,&#10;&#10;We've moved the workshop to Hall B..."
                  className="min-h-[220px] resize-y"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Plain text formatted email. Links will be automatically clickable for attendees.
                </p>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-border">
                <Button type="button" variant="outline" asChild>
                  <Link href={`/dashboard/events/${eventId}`}>
                    Cancel
                  </Link>
                </Button>
                <Button type="submit" disabled={loading || !subject.trim() || !body.trim()} className="gap-2">
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {loading ? "Dispatching Queue..." : "Send Broadcast"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Broadcast Delivery History */}
        <div className="space-y-4">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <History className="w-4 h-4 text-primary" /> Past Broadcasts
              </CardTitle>
              <CardDescription className="text-xs">
                History of announcements sent for this event.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingHistory ? (
                <div className="flex items-center justify-center p-6 text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : history.length === 0 ? (
                <p className="text-xs text-muted-foreground italic text-center p-6 bg-muted/20 rounded-xl">
                  No previous broadcasts sent.
                </p>
              ) : (
                <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                  {history.map((job) => (
                    <div key={job.id} className="p-3 bg-muted/30 border border-border/70 rounded-xl text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground truncate max-w-[140px]" title={job.subject}>
                          {job.subject}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          job.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' :
                          job.status === 'processing' ? 'bg-blue-500/10 text-blue-600' :
                          job.status === 'failed' ? 'bg-rose-500/10 text-rose-600' : 'bg-muted text-muted-foreground'
                        }`}>
                          {job.status === 'completed' && <CheckCircle2 className="w-2.5 h-2.5" />}
                          {job.status === 'failed' && <XCircle className="w-2.5 h-2.5" />}
                          {job.status === 'processing' && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                          {job.status}
                        </span>
                      </div>
                      <div className="flex justify-between text-muted-foreground text-[11px] pt-1 border-t border-border/40">
                        <span>Recipients: {job.sent_count}/{job.total_recipients}</span>
                        <span>{new Date(job.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
