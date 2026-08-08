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
  const [payoutMethod, setPayoutMethod] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPayout, setSavingPayout] = useState(false);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (profileData) setProfile(profileData);

      const { data: payoutData } = await supabase.from('organizer_payout_methods').select('*').eq('user_id', session.user.id).single();
      if (payoutData) setPayoutMethod(payoutData);

      setLoading(false);
    }
    loadData();
  }, []);

  async function handleSaveProfile(e: React.FormEvent) {
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

  async function handleSavePayout(e: React.FormEvent) {
    e.preventDefault();
    setSavingPayout(true);
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      const payload = {
        user_id: session.user.id,
        method: payoutMethod?.method || 'bank',
        account_details: payoutMethod?.account_details || {}
      };

      const { error } = await supabase
        .from('organizer_payout_methods')
        .upsert(payload, { onConflict: 'user_id' });

      if (error) {
        toast.error("Failed to update payout details.");
      } else {
        toast.success("Payout details updated successfully!");
      }
    }
    setSavingPayout(false);
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

      <form onSubmit={handleSaveProfile} className="space-y-6 bg-card border border-border p-6 rounded-xl shadow-sm">
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

      <form onSubmit={handleSavePayout} className="space-y-6 bg-card border border-border p-6 rounded-xl shadow-sm">
        <div className="flex items-center gap-3 border-b border-border pb-3">
          <Wallet className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Organizer Payout Settings</h3>
        </div>
        
        <p className="text-sm text-muted-foreground">
          How would you like to receive your ticket sales revenue? SwiftVenue processes batch payouts on a weekly basis.
        </p>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Payout Method</Label>
            <select 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={payoutMethod?.method || 'bank'}
              onChange={e => setPayoutMethod({ ...payoutMethod, method: e.target.value })}
            >
              <option value="bank">Bank Transfer</option>
              <option value="jazzcash">JazzCash</option>
              <option value="easypaisa">EasyPaisa</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <Label>Account Details</Label>
            <textarea
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 font-mono"
              placeholder={`Example:\nTitle: Ali Khan\nIBAN: PK12MEZN000123456789`}
              required
              value={payoutMethod?.account_details?.text || ''}
              onChange={e => setPayoutMethod({ ...payoutMethod, account_details: { text: e.target.value } })}
            />
          </div>
        </div>

        <div className="pt-4 border-t border-border flex justify-end">
          <Button type="submit" disabled={savingPayout} className="gap-2">
            <Save className="w-4 h-4" /> Save Payout Details
          </Button>
        </div>
      </form>
    </div>
  );
}
