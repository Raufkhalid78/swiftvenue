import { ImageResponse } from 'next/og';
import { createServiceClient } from '@/lib/supabase/server';

export const runtime = 'edge';

export const alt = 'Event Details on SwiftVenue';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = createServiceClient();

  const { data: event } = await service
    .from('events')
    .select('title, description, date, time, venue_name, ticket_price, theme_color')
    .eq('slug', slug)
    .single();

  const title = event?.title || 'SwiftVenue Event';
  const venue = event?.venue_name || 'Venue TBA';
  const date = event?.date ? new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Upcoming';
  const time = event?.time || '';
  const price = Number(event?.ticket_price || 0) === 0 ? 'Free Admission' : `Tickets from Rs. ${Number(event?.ticket_price || 0).toLocaleString()}`;
  const themeColor = event?.theme_color || '#3b82f6';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px 80px',
          background: '#090d16',
          color: '#ffffff',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Background glow decorative spots */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: themeColor,
            opacity: 0.15,
            filter: 'blur(90px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-150px',
            left: '-100px',
            width: '450px',
            height: '450px',
            borderRadius: '50%',
            background: '#6366f1',
            opacity: 0.12,
            filter: 'blur(80px)',
          }}
        />

        {/* Header Branding & Badges */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '10px 24px',
              borderRadius: '999px',
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: '-0.02em',
            }}
          >
            <span style={{ color: '#38bdf8', marginRight: '8px' }}>✦</span> SwiftVenue
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#34d399',
              padding: '10px 22px',
              borderRadius: '999px',
              fontSize: 20,
              fontWeight: 600,
            }}
          >
            {price}
          </div>
        </div>

        {/* Main Event Title */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1000px', marginTop: '20px' }}>
          <div
            style={{
              fontSize: title.length > 40 ? 56 : 68,
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              color: '#ffffff',
              display: '-webkit-box',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </div>
        </div>

        {/* Footer Meta Details */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '32px',
            borderTop: '1px solid rgba(255, 255, 255, 0.12)',
            paddingTop: '32px',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: 24, color: '#cbd5e1' }}>
            <span style={{ color: '#38bdf8' }}>📅</span>
            <span>{date} {time ? `• ${time}` : ''}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: 24, color: '#cbd5e1' }}>
            <span style={{ color: '#f43f5e' }}>📍</span>
            <span>{venue}</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
