import { ImageResponse } from 'next/og'
 
export const runtime = 'edge'
 
export const alt = 'SwiftVenue - Fast and seamless event ticketing'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'
 
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to bottom right, #000000, #1a1a1a)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(to right, #4facfe 0%, #00f2fe 100%)',
            padding: '20px 60px',
            borderRadius: '20px',
            fontSize: 80,
            fontWeight: 800,
            letterSpacing: '-0.05em',
            marginBottom: '40px',
          }}
        >
          SwiftVenue
        </div>
        <div
          style={{
            fontSize: 40,
            fontWeight: 500,
            color: '#a1a1aa',
            letterSpacing: '-0.02em',
          }}
        >
          Fast, seamless event ticketing
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
