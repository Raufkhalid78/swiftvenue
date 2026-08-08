"use client";

import { useEffect, useState, use } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus, Shield, X, Mail } from "lucide-react";

export default function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

  useEffect(() => {
    async function loadTeam() {
      const supabase = createClient();
      // Need to query profiles for user info, but we only have user_id in event_collaborators
      const { data } = await supabase
        .from('event_collaborators')
        .select('*, profiles(full_name, email)')
        .eq('event_id', resolvedParams.id);
      
      if (data) setTeam(data);
      setLoading(false);
    }
    loadTeam();
  }, [resolvedParams.id]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setInviteLoading(true);
    // In a real app we would call an API route to lookup the user by email or send an invite email.
    // Here we'll just mock it.
    alert("Invite feature requires the user to already have an account or a server-side lookup via Supabase Admin API.");
    setEmail("");
    setInviteLoading(false);
  };

  const handleRemove = async (userId: string) => {
    const supabase = createClient();
    await supabase.from('event_collaborators').delete().eq('event_id', resolvedParams.id).eq('user_id', userId);
    setTeam(team.filter(t => t.user_id !== userId));
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold font-display">Team Management</h2>
        <p className="text-sm text-muted-foreground mt-1">Invite co-organizers to help manage this event.</p>
      </div>

      <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
        <h3 className="font-semibold mb-4">Invite Team Member</h3>
        <form onSubmit={handleInvite} className="flex items-center gap-3">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              type="email" 
              placeholder="Email address..." 
              className="pl-9" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={inviteLoading}
            />
          </div>
          <Button type="submit" disabled={inviteLoading} className="gap-2">
            <UserPlus className="w-4 h-4" />
            Send Invite
          </Button>
        </form>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20">
          <h3 className="font-semibold text-sm">Active Members</h3>
        </div>
        <div className="divide-y divide-border">
          {loading ? (
             <div className="p-6 space-y-4">
               <Skeleton className="h-12 w-full" />
               <Skeleton className="h-12 w-full" />
             </div>
          ) : team.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No team members yet.</p>
              <p className="text-sm">You are the sole manager of this event.</p>
            </div>
          ) : (
            team.map((member) => (
              <div key={member.user_id} className="flex items-center justify-between p-4 px-6 hover:bg-muted/30 transition-colors">
                <div>
                  <p className="font-medium text-foreground">{member.profiles?.full_name || 'Unknown User'}</p>
                  <p className="text-sm text-muted-foreground">{member.profiles?.email}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-medium bg-secondary text-secondary-foreground px-2 py-1 rounded-md uppercase tracking-wider">
                    {member.role}
                  </span>
                  <Button variant="ghost" size="icon" onClick={() => handleRemove(member.user_id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
