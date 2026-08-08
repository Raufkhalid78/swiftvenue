import { createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BillingClient } from "./billing-client";

export const metadata = {
  title: "Billing & Plans - SwiftVenue",
};

export default async function BillingPage() {
  const service = createServiceClient();
  const { data: { user }, error: authErr } = await service.auth.getUser();

  if (authErr || !user) {
    redirect("/login");
  }

  // Fetch the user's current plan
  const { data: profile } = await service
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single();

  const currentPlan = profile?.plan || 'free';

  // Fetch all available plans
  const { data: plans } = await service
    .from('plans')
    .select('*')
    .order('monthly_price', { ascending: true });

  // Fetch any pending upgrade requests
  const { data: upgradeRequests } = await service
    .from('upgrade_requests')
    .select('plan_id, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const pendingRequest = upgradeRequests?.find(req => req.status === 'pending');

  return (
    <BillingClient 
      currentPlan={currentPlan} 
      plans={plans || []} 
      pendingRequest={pendingRequest || null} 
    />
  );
}
