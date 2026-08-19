'use server';

import { createClient, createServiceClient } from '@/lib/supabase/server';
import { checkEventAccess } from '@/lib/team';
import crypto from 'crypto';
import { dispatchWebhook } from '@/lib/webhooks';

export async function getWebhooks(eventId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const service = createServiceClient();
  const hasAccess = await checkEventAccess(service, eventId, user.id, ['owner', 'coorganizer']);
  if (!hasAccess) throw new Error('Unauthorized');

  const { data, error } = await service
    .from('event_webhooks')
    .select('*, webhook_deliveries(id, event_type, response_code, duration_ms, status, created_at)')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function createWebhook(eventId: string, { url, subscribedEvents }: { url: string; subscribedEvents: string[] }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const service = createServiceClient();
  const hasAccess = await checkEventAccess(service, eventId, user.id, ['owner', 'coorganizer']);
  if (!hasAccess) throw new Error('Unauthorized');

  const secret = `whsec_${crypto.randomBytes(24).toString('hex')}`;

  const { data, error } = await service
    .from('event_webhooks')
    .insert({
      event_id: eventId,
      url,
      secret,
      subscribed_events: subscribedEvents,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function toggleWebhook(webhookId: string, eventId: string, isActive: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const service = createServiceClient();
  const hasAccess = await checkEventAccess(service, eventId, user.id, ['owner', 'coorganizer']);
  if (!hasAccess) throw new Error('Unauthorized');

  const { error } = await service
    .from('event_webhooks')
    .update({ is_active: isActive })
    .eq('id', webhookId);

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function deleteWebhook(webhookId: string, eventId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const service = createServiceClient();
  const hasAccess = await checkEventAccess(service, eventId, user.id, ['owner', 'coorganizer']);
  if (!hasAccess) throw new Error('Unauthorized');

  const { error } = await service
    .from('event_webhooks')
    .delete()
    .eq('id', webhookId);

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function sendTestPing(webhookId: string, eventId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const service = createServiceClient();
  const hasAccess = await checkEventAccess(service, eventId, user.id, ['owner', 'coorganizer']);
  if (!hasAccess) throw new Error('Unauthorized');

  await dispatchWebhook(eventId, 'order.paid', {
    test: true,
    message: 'This is a test webhook payload from SwiftVenue',
    orderId: 'test_ord_' + Date.now(),
    amount: 1500,
    currency: 'PKR',
    guestName: 'Jane Test',
    guestEmail: 'test@example.com',
  });

  return { success: true };
}
