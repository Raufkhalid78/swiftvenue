"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function SaveButton({ 
  eventId, 
  iconOnly = false,
  onToggle
}: { 
  eventId: string; 
  iconOnly?: boolean;
  onToggle?: (isSaved: boolean) => void;
}) {
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
        .maybeSingle();
      
      if (data) {
        setIsSaved(true);
      }
      setIsLoading(false);
    }
    checkStatus();
  }, [eventId, supabase]);

  const toggleSave = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

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
        onToggle?.(false);
        router.refresh();
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
        onToggle?.(true);
        router.refresh();
      } else {
        toast.error("Failed to save event");
      }
    }
    setIsLoading(false);
  };

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={toggleSave}
        disabled={isLoading}
        aria-label={isSaved ? "Remove from saved events" : "Save event"}
        className={`p-2.5 rounded-full backdrop-blur-md shadow-md transition-all duration-200 cursor-pointer ${
          isSaved 
            ? 'bg-white/95 dark:bg-zinc-900/95 text-red-500 hover:scale-110 hover:bg-red-50 dark:hover:bg-red-950/40' 
            : 'bg-black/40 text-white hover:bg-black/60 hover:scale-110'
        }`}
      >
        <Heart className={`w-4 h-4 transition-transform ${isSaved ? 'fill-red-500 scale-105' : ''}`} />
      </button>
    );
  }

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
