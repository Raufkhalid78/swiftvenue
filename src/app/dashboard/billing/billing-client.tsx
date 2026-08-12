'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { submitUpgradeRequest } from './actions';

interface Plan {
  id: string;
  name: string;
  monthly_price: number;
  yearly_price: number | null;
  fee_percent: number;
  fee_fixed: number;
  max_concurrent_paid_events: number | null;
  remove_branding: boolean;
  broadcast_limit: number | null;
}

export function BillingClient({ 
  currentPlan, 
  plans, 
  pendingRequest 
}: { 
  currentPlan: string; 
  plans: Plan[]; 
  pendingRequest: any;
}) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [reference, setReference] = useState('');

  const handleUpgradeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    
    setLoading(true);
    const formData = new FormData();
    formData.append('planId', selectedPlan);
    formData.append('referenceNumber', reference);

    const result = await submitUpgradeRequest(formData);
    
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Upgrade request submitted successfully!');
      setSelectedPlan(null);
      setReference('');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Billing & Plans</h1>
        <p className="text-muted-foreground mt-2">Manage your subscription and platform fees.</p>
      </div>

      {pendingRequest && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-600 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">Upgrade Request Pending</h4>
            <p className="text-sm mt-1">We are currently verifying your payment for the {plans.find(p => p.id === pendingRequest.plan_id)?.name} plan. This usually takes 24 hours.</p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const isPopular = plan.id === 'pro';

          return (
            <Card key={plan.id} className={`relative flex flex-col ${isPopular ? 'border-primary shadow-lg scale-[1.02]' : 'border-border'} transition-all`}>
              {isPopular && (
                <div className="absolute -top-3 inset-x-0 flex justify-center">
                  <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                    <Sparkles className="w-3 h-3" /> Most Popular
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl font-display">{plan.name}</CardTitle>
                <CardDescription>
                  {plan.id === 'enterprise' ? (
                    <span className="text-3xl font-bold text-foreground">Custom</span>
                  ) : plan.monthly_price > 0 ? (
                    <span className="text-3xl font-bold text-foreground">
                      Rs {plan.monthly_price.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">/mo</span>
                    </span>
                  ) : (
                    <span className="text-3xl font-bold text-foreground">Free</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="bg-muted/30 p-3 rounded-lg border border-border">
                  <p className="text-sm font-semibold text-foreground mb-1">Platform Fee (per ticket)</p>
                  <p className="text-xl font-bold text-primary">
                    {plan.fee_percent}% + Rs {plan.fee_fixed}
                  </p>
                </div>
                
                <ul className="space-y-2.5 text-sm pt-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald shrink-0 mt-0.5" />
                    <span>{plan.max_concurrent_paid_events === null ? 'Unlimited' : plan.max_concurrent_paid_events} concurrent paid events</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald shrink-0 mt-0.5" />
                    <span>{plan.broadcast_limit === null ? 'Unlimited' : plan.broadcast_limit} email broadcasts</span>
                  </li>
                  {plan.remove_branding && (
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald shrink-0 mt-0.5" />
                      <span>Remove SwiftVenue branding</span>
                    </li>
                  )}
                </ul>
              </CardContent>
              <CardFooter>
                {isCurrent ? (
                  <Button className="w-full" variant="secondary" disabled>
                    Current Plan
                  </Button>
                ) : plan.id === 'enterprise' ? (
                  <a href="mailto:sales@swiftvenuehq.com" className="w-full block">
                    <Button className="w-full" variant="outline">
                      Contact Sales
                    </Button>
                  </a>
                ) : (
                  <Button 
                    className="w-full" 
                    variant={isPopular ? 'default' : 'outline'}
                    onClick={() => setSelectedPlan(plan.id)}
                    disabled={!!pendingRequest && selectedPlan !== plan.id}
                  >
                    Upgrade to {plan.name}
                  </Button>
                )}
              </CardFooter>
            </Card>
          )
        })}
      </div>

      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border p-6 animate-in zoom-in-95">
            <h3 className="text-2xl font-bold font-display mb-2">Manual Upgrade</h3>
            <p className="text-sm text-muted-foreground mb-6">
              To upgrade to the {plans.find(p => p.id === selectedPlan)?.name} plan, please transfer the amount to our bank account and provide the reference number.
            </p>

            <div className="bg-muted p-4 rounded-xl border border-border mb-6 space-y-2 font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-bold">Rs {plans.find(p => p.id === selectedPlan)?.monthly_price?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bank:</span>
                <span className="font-bold">Meezan Bank</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account Title:</span>
                <span className="font-bold">SwiftVenue Pvt Ltd</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">IBAN:</span>
                <span className="font-bold tracking-wider">PK12MEZN000123456789</span>
              </div>
            </div>

            <form onSubmit={handleUpgradeRequest} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ref">Payment Reference Number / Transaction ID</Label>
                <Input 
                  id="ref" 
                  required 
                  placeholder="e.g. 123456789012" 
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setSelectedPlan(null)} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={loading || !reference}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Submit Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
