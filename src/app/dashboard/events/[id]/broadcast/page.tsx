"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function BroadcastPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

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
        toast.success(`Successfully sent email to ${data.count} attendees!`);
        router.push(`/dashboard/events/${eventId}`);
      } else {
        toast.error(data.error || "Failed to send broadcast");
      }
    } catch (err: any) {
      toast.error("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/events/${eventId}`}>
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold font-display">Email Attendees</h1>
          <p className="text-muted-foreground text-sm">Send updates or important information to everyone registered.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Broadcast Message</CardTitle>
          <CardDescription>
            This email will be sent via BCC to protect attendee privacy.
          </CardDescription>
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
                placeholder="Hi everyone,&#10;&#10;We've moved the event to..."
                className="min-h-[250px] resize-y"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Plain text only for now. Emojis are supported! 🚀
              </p>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-border">
              <Button type="button" variant="outline" asChild>
                <Link href={`/dashboard/events/${eventId}`}>
                  Cancel
                </Link>
              </Button>
              <Button type="submit" disabled={loading || !subject.trim() || !body.trim()}>
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Send Broadcast
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
