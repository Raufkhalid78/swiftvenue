import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';

export type WebhookEventType = 
  | 'order.paid' 
  | 'attendee.checked_in' 
  | 'ticket.transferred' 
  | 'waitlist.joined';

export interface WebhookPayload {
  event: WebhookEventType;
  timestamp: string;
  eventId: string;
  data: Record<string, any>;
}

export async function dispatchWebhook(
  eventId: string,
  eventType: WebhookEventType,
  data: Record<string, any>
) {
  try {
    const service = createServiceClient();

    // 1. Fetch active webhooks listening for this event
    const { data: webhooks, error } = await service
      .from('event_webhooks')
      .select('*')
      .eq('event_id', eventId)
      .eq('is_active', true);

    if (error || !webhooks || webhooks.length === 0) return;

    const matchingWebhooks = webhooks.filter(w => 
      !w.subscribed_events || w.subscribed_events.includes(eventType)
    );

    if (matchingWebhooks.length === 0) return;

    const payload: WebhookPayload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      eventId,
      data,
    };

    const payloadString = JSON.stringify(payload);

    // 2. Dispatch to each endpoint in parallel
    await Promise.allSettled(
      matchingWebhooks.map(async (webhook) => {
        const startTime = Date.now();
        const signature = crypto
          .createHmac('sha256', webhook.secret)
          .update(payloadString)
          .digest('hex');

        let statusCode = 0;
        let responseBody = '';
        let status: 'success' | 'failed' = 'failed';

        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 6000);

          const res = await fetch(webhook.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'SwiftVenue-Webhook/1.0',
              'X-SwiftVenue-Signature': signature,
              'X-SwiftVenue-Event': eventType,
            },
            body: payloadString,
            signal: controller.signal,
          });

          clearTimeout(timeout);
          statusCode = res.status;
          responseBody = (await res.text()).slice(0, 1000);
          status = res.ok ? 'success' : 'failed';
        } catch (err: any) {
          responseBody = err.message || 'Connection failed/timeout';
          statusCode = 500;
          status = 'failed';
        } finally {
          const duration = Date.now() - startTime;
          await service.from('webhook_deliveries').insert({
            webhook_id: webhook.id,
            event_type: eventType,
            payload: payload as any,
            response_code: statusCode,
            response_body: responseBody,
            duration_ms: duration,
            status,
          });
        }
      })
    );
  } catch (err) {
    console.error('Webhook dispatch engine error:', err);
  }
}
