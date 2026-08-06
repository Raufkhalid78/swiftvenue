"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, Wallet, Shield } from "lucide-react";

export default function GlobalSettingsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (data) setProfile(data);
      setLoading(false);
    }
    loadProfile();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
      })
      .eq('id', profile.id);

    setSaving(false);
    if (error) {
      toast.error("Failed to update profile.");
    } else {
      toast.success("Profile updated successfully!");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl pb-12">
      <div>
        <h2 className="text-3xl font-bold font-display tracking-tight">Account Settings</h2>
        <p className="text-muted-foreground mt-1">Manage your organizer profile and platform integrations.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 bg-card border border-border p-6 rounded-xl shadow-sm">
        <div className="flex items-center gap-3 border-b border-border pb-3">
          <Shield className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Organizer Profile</h3>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Full Name / Organizer Name</Label>
            <Input value={profile?.full_name || ''} onChange={e => setProfile({...profile, full_name: e.target.value})} required />
          </div>
          <div className="space-y-2">
            <Label>Account Email</Label>
            <Input value={profile?.email || 'user@example.com'} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">Email cannot be changed directly.</p>
          </div>
        </div>

        <div className="pt-4 border-t border-border flex justify-end">
          <Button type="submit" disabled={saving} className="gap-2">
            <Save className="w-4 h-4" /> Save Profile
          </Button>
        </div>
      </form>

      <div className="space-y-6 bg-card border border-border p-6 rounded-xl shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-3">
            <Wallet className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Payment Integration (Safepay)</h3>
          </div>
          <span className="px-2 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-xs font-medium">Connected</span>
        </div>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your Safepay account is successfully linked. All ticket sales from your paid events will be directly routed to your configured payout bank account.
          </p>
          
          <div className="bg-muted/50 p-4 rounded-lg flex items-center justify-between">
            <div>
              <p className="font-medium">Merchant ID: <span>mer_sandbox_XXXXXX</span></p>
              <p className="text-xs text-muted-foreground mt-1">Environment: Sandbox</p>
            </div>
            <Button variant="outline" size="sm">Manage on Safepay</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
