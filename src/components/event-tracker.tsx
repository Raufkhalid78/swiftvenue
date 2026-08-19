'use client';

import { useEffect } from 'react';

export function trackEvent(eventId: string, eventType: 'page_view' | 'initiate_checkout' | 'waitlist_join' | 'purchase') {
  if (typeof window === 'undefined' || !eventId) return;

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = urlParams.get('utm_source') || urlParams.get('ref') || null;
    const referrer = document.referrer || null;

    const payload = JSON.stringify({
      eventId,
      eventType,
      referrer,
      utmSource,
    });

    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon('/api/analytics/track', blob);
    } else {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Fail silently so tracking never interrupts user checkout
  }
}

export function EventTracker({ eventId }: { eventId: string }) {
  useEffect(() => {
    trackEvent(eventId, 'page_view');
  }, [eventId]);

  return null;
}
