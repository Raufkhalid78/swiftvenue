"use client";

import { useEffect, useState, use } from "react";
import { Star, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export default function FeedbackDashboard({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeedback() {
      const supabase = createClient();
      const { data } = await supabase
        .from('event_feedback')
        .select('*')
        .eq('event_id', resolvedParams.id)
        .order('created_at', { ascending: false });
      
      if (data) setFeedback(data);
      setLoading(false);
    }
    loadFeedback();
  }, [resolvedParams.id]);

  const averageRating = feedback.length > 0 
    ? (feedback.reduce((acc, curr) => acc + curr.rating, 0) / feedback.length).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold font-display">Guest Feedback</h2>
        <p className="text-sm text-muted-foreground mt-1">Review ratings and comments from your attendees.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-card border border-border p-6 rounded-xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center shrink-0">
            <Star className="w-6 h-6 fill-amber-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Average Rating</p>
            <p className="text-2xl font-bold">{averageRating} / 5.0</p>
          </div>
        </div>
        <div className="bg-card border border-border p-6 rounded-xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Responses</p>
            <p className="text-2xl font-bold">{feedback.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ) : feedback.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p>No feedback received yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {feedback.map((item) => (
              <div key={item.id} className="p-6 hover:bg-muted/30 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold">{item.guest_name || 'Anonymous'}</p>
                    {item.guest_email && <p className="text-sm text-muted-foreground">{item.guest_email}</p>}
                  </div>
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < item.rating ? 'fill-amber-400' : 'text-muted-foreground/30'}`} />
                    ))}
                  </div>
                </div>
                {item.comment && (
                  <p className="text-sm text-foreground/90 mt-3 bg-muted/50 p-3 rounded-lg border border-border/50">
                    "{item.comment}"
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-3">
                  Submitted on {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
