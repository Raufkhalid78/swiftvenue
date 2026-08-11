'use client';

import { useState } from 'react';
import { updatePlan } from './actions';
import { Save, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export function PlansClient({ initialPlans }: { initialPlans: any[] }) {
  const [plans, setPlans] = useState(initialPlans);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const handleSave = async (plan: any) => {
    setSavingId(plan.id);
    const updates = {
      name: plan.name,
      monthly_price: plan.monthly_price,
      yearly_price: plan.yearly_price,
      fee_percent: plan.fee_percent,
      fee_fixed: plan.fee_fixed,
      max_concurrent_paid_events: plan.max_concurrent_paid_events,
      remove_branding: plan.remove_branding,
      broadcast_limit: plan.broadcast_limit
    };
    
    const result = await updatePlan(plan.id, updates);
    if (result.success) {
      setEditingId(null);
      toast.success('Plan updated successfully');
    } else {
      toast.error(result.error);
    }
    setSavingId(null);
  };

  const updateField = (id: string, field: string, value: any) => {
    setPlans(plans.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {plans.map((plan) => {
        const isEditing = editingId === plan.id;
        const isSaving = savingId === plan.id;

        return (
          <div key={plan.id} className="bg-background rounded-xl border border-border overflow-hidden flex flex-col">
            <div className="p-6 border-b border-border bg-muted/20 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold capitalize">{plan.name} Plan</h3>
                <p className="text-muted-foreground text-sm mt-1">ID: {plan.id}</p>
              </div>
              {!isEditing ? (
                <button 
                  onClick={() => setEditingId(plan.id)}
                  className="px-3 py-1.5 text-sm font-medium border border-border rounded hover:bg-muted transition-colors"
                >
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button 
                    onClick={() => setEditingId(null)}
                    className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    disabled={isSaving}
                    onClick={() => handleSave(plan)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : <><Save className="w-4 h-4" /> Save</>}
                  </button>
                </div>
              )}
            </div>

            <div className="p-6 flex-grow space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Monthly Price (Rs)</label>
                  {isEditing ? (
                    <input 
                      type="number"
                      value={plan.monthly_price ?? ''}
                      onChange={e => updateField(plan.id, 'monthly_price', e.target.value ? Number(e.target.value) : null)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  ) : (
                    <div className="font-medium">{plan.monthly_price !== null ? `Rs ${plan.monthly_price}` : 'N/A'}</div>
                  )}
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Yearly Price (Rs)</label>
                  {isEditing ? (
                    <input 
                      type="number"
                      value={plan.yearly_price ?? ''}
                      onChange={e => updateField(plan.id, 'yearly_price', e.target.value ? Number(e.target.value) : null)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  ) : (
                    <div className="font-medium">{plan.yearly_price !== null ? `Rs ${plan.yearly_price}` : 'N/A'}</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fee Percentage</label>
                  {isEditing ? (
                    <input 
                      type="number"
                      step="0.1"
                      value={plan.fee_percent}
                      onChange={e => updateField(plan.id, 'fee_percent', Number(e.target.value))}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  ) : (
                    <div className="font-medium">{plan.fee_percent}%</div>
                  )}
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fixed Fee (Rs)</label>
                  {isEditing ? (
                    <input 
                      type="number"
                      value={plan.fee_fixed}
                      onChange={e => updateField(plan.id, 'fee_fixed', Number(e.target.value))}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  ) : (
                    <div className="font-medium">Rs {plan.fee_fixed}</div>
                  )}
                </div>
              </div>

              <div className="space-y-4 border-t border-border pt-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Max Concurrent Events</label>
                  {isEditing ? (
                    <input 
                      type="number"
                      placeholder="Leave empty for unlimited"
                      value={plan.max_concurrent_paid_events ?? ''}
                      onChange={e => updateField(plan.id, 'max_concurrent_paid_events', e.target.value ? Number(e.target.value) : null)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  ) : (
                    <div className="font-medium">{plan.max_concurrent_paid_events !== null ? plan.max_concurrent_paid_events : 'Unlimited'}</div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Broadcast Limit</label>
                  {isEditing ? (
                    <input 
                      type="number"
                      placeholder="Leave empty for unlimited"
                      value={plan.broadcast_limit ?? ''}
                      onChange={e => updateField(plan.id, 'broadcast_limit', e.target.value ? Number(e.target.value) : null)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  ) : (
                    <div className="font-medium">{plan.broadcast_limit !== null ? plan.broadcast_limit : 'Unlimited'}</div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Remove Platform Branding</label>
                  {isEditing ? (
                    <input 
                      type="checkbox"
                      checked={plan.remove_branding}
                      onChange={e => updateField(plan.id, 'remove_branding', e.target.checked)}
                      className="w-4 h-4 text-primary rounded border-border focus:ring-primary/20"
                    />
                  ) : (
                    <div className="font-medium flex items-center">
                      {plan.remove_branding ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <span className="text-muted-foreground">No</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
