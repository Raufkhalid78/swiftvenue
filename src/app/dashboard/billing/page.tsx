import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BillingClient } from "./billing-client";

export const metadata = {
  title: "Billing & Plans - SwiftVenue",
};

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();

  if (authErr || !user) {
    redirect("/login");
  }

  // Fetch user profile, plans, and upgrade requests in parallel
  const [{ data: profile }, { data: plans }, { data: upgradeRequests }] = await Promise.all([
    supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single(),
    supabase
      .from('plans')
      .select('*')
      .order('monthly_price', { ascending: true }),
    supabase
      .from('upgrade_requests')
      .select('plan_id, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
  ]);

  const currentPlan = profile?.plan || 'free';
  const pendingRequest = upgradeRequests?.find(req => req.status === 'pending');

  return (
    <BillingClient 
      currentPlan={currentPlan} 
      plans={plans || []} 
      pendingRequest={pendingRequest || null} 
    />
  );
}
