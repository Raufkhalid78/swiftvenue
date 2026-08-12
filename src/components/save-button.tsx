"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function SaveButton({ eventId }: { eventId: string }) {
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function checkStatus() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsLoading(false);
        return;
      }
      setUser(session.user);

      const { data } = await supabase
        .from('saved_events')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', session.user.id)
        .single();
      
      if (data) {
        setIsSaved(true);
      }
      setIsLoading(false);
    }
    checkStatus();
  }, [eventId, supabase]);

  const toggleSave = async () => {
    if (!user) {
      toast.error("Please sign in to save events");
      router.push("/auth/signin");
      return;
    }

    setIsLoading(true);
    if (isSaved) {
      const { error } = await supabase
        .from('saved_events')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id);
      
      if (!error) {
        setIsSaved(false);
        toast.success("Event removed from saved list");
      } else {
        toast.error("Failed to remove event");
      }
    } else {
      const { error } = await supabase
        .from('saved_events')
        .insert([{ event_id: eventId, user_id: user.id }]);
      
      if (!error) {
        setIsSaved(true);
        toast.success("Event saved!");
      } else {
        toast.error("Failed to save event");
      }
    }
    setIsLoading(false);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className={`gap-2 ${isSaved ? 'text-red-500 border-red-200 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:border-red-900/50 dark:hover:bg-red-900/30' : ''}`}
      onClick={toggleSave}
      disabled={isLoading}
    >
      <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
      {isSaved ? 'Saved' : 'Save'}
    </Button>
  );
}
