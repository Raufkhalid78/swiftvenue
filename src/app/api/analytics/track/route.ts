import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const runtime = 'edge';

function getDeviceType(userAgent: string): 'mobile' | 'tablet' | 'desktop' {
  const ua = userAgent.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, eventType, referrer, utmSource } = body;

    if (!eventId || !eventType) {
      return NextResponse.json({ error: 'Missing eventId or eventType' }, { status: 400 });
    }

    const validTypes = ['page_view', 'initiate_checkout', 'waitlist_join', 'purchase'];
    if (!validTypes.includes(eventType)) {
      return NextResponse.json({ error: 'Invalid eventType' }, { status: 400 });
    }

    const countryCode = request.headers.get('x-vercel-ip-country') || 
                        request.headers.get('x-detected-country') || 
                        'PK';
    const userAgent = request.headers.get('user-agent') || '';
    const deviceType = getDeviceType(userAgent);

    const service = createServiceClient();

    const { error } = await service.from('event_telemetry').insert({
      event_id: eventId,
      event_type: eventType,
      referrer: referrer?.slice(0, 500) || null,
      utm_source: utmSource?.slice(0, 100) || null,
      country_code: countryCode.toUpperCase(),
      device_type: deviceType,
    });

    if (error) {
      console.error('Failed to log telemetry:', error);
      return NextResponse.json({ error: 'Failed to record' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/analytics/track error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
