import { describe, it, expect } from 'vitest';
import crypto from 'crypto';

export function signWebhookPayload(payloadString: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payloadString).digest('hex');
}

export function verifyWebhookSignature(payloadString: string, secret: string, signature: string): boolean {
  const expected = signWebhookPayload(payloadString, secret);
  return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
}

describe('Outbound Webhooks HMAC-SHA256 Security Engine', () => {
  const secret = 'whsec_7d9e83f98273b49a0293847291a02938';
  const payload = {
    event: 'order.paid',
    timestamp: '2026-08-20T12:00:00Z',
    eventId: 'evt_12345',
    data: {
      orderId: 'ord_9876',
      amount: 4500,
      currency: 'PKR',
      guestName: 'Zainab Ahmed',
    },
  };

  const payloadString = JSON.stringify(payload);

  it('generates consistent HMAC-SHA256 signature for identical payload and secret', () => {
    const sig1 = signWebhookPayload(payloadString, secret);
    const sig2 = signWebhookPayload(payloadString, secret);

    expect(sig1).toBe(sig2);
    expect(sig1).toHaveLength(64); // 256 bits = 64 hex characters
  });

  it('verifies valid signatures accurately with timing-safe comparison', () => {
    const signature = signWebhookPayload(payloadString, secret);
    const isValid = verifyWebhookSignature(payloadString, secret, signature);

    expect(isValid).toBe(true);
  });

  it('rejects tampered payload content', () => {
    const signature = signWebhookPayload(payloadString, secret);
    const tamperedPayload = JSON.stringify({ ...payload, data: { ...payload.data, amount: 0 } });
    const isValid = verifyWebhookSignature(tamperedPayload, secret, signature);

    expect(isValid).toBe(false);
  });

  it('rejects signatures generated with different secret', () => {
    const wrongSecret = 'whsec_different_secret_key_1234567890';
    const signature = signWebhookPayload(payloadString, wrongSecret);
    const isValid = verifyWebhookSignature(payloadString, secret, signature);

    expect(isValid).toBe(false);
  });
});
