"use client";

import { useState, use } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Star, Loader2, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function FeedbackPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    // 1. Get Event ID by slug
    const { data: eventData, error: eventErr } = await supabase
      .from("events")
      .select("id")
      .eq("slug", resolvedParams.slug)
      .single();

    if (eventErr || !eventData) {
      toast.error("Event not found");
      setLoading(false);
      return;
    }

    // 2. Insert feedback
    const { error } = await supabase.from("event_feedback").insert({
      event_id: eventData.id,
      guest_name: name,
      guest_email: email,
      rating,
      comment
    });

    setLoading(false);

    if (error) {
      toast.error("Failed to submit feedback: " + error.message);
    } else {
      setSubmitted(true);
      toast.success("Thank you for your feedback!");
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4">
        <div className="bg-card w-full max-w-md rounded-3xl p-8 border border-border shadow-sm text-center animate-in fade-in slide-in-from-bottom-4">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold font-display mb-2">Thank You!</h2>
          <p className="text-muted-foreground mb-6">Your feedback has been successfully submitted and will help us improve future events.</p>
          <Button variant="outline" onClick={() => router.push(`/e/${resolvedParams.slug}`)}>Return to Event</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4 py-12">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-display tracking-tight mb-2">How was the event?</h1>
          <p className="text-muted-foreground">We'd love to hear your thoughts so we can make our next event even better.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-3xl p-6 sm:p-8 border border-border shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4">
          
          <div className="flex flex-col items-center space-y-4">
            <Label className="text-lg">Overall Rating</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="transition-transform hover:scale-110 active:scale-95 focus:outline-none"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star 
                    className={`w-10 h-10 ${
                      star <= (hoverRating || rating) 
                        ? "fill-amber-400 text-amber-400" 
                        : "text-muted-foreground/30"
                    }`} 
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="comment">What did you like? What could be improved?</Label>
              <Textarea 
                id="comment" 
                placeholder="Share your experience..." 
                className="min-h-[120px] resize-none"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-border/50">
              <div className="space-y-2">
                <Label htmlFor="name">Name (Optional)</Label>
                <Input 
                  id="name" 
                  placeholder="Jane Doe" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input 
                  id="email" 
                  type="email"
                  placeholder="jane@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full h-12 text-base rounded-xl" disabled={loading || rating === 0}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Feedback"}
          </Button>
        </form>
      </div>
    </div>
  );
}
