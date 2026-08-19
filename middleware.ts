import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {

  const nonce = crypto.randomUUID()
  
  const isEmbed = request.nextUrl.pathname.startsWith('/embed/');
  const isPayment = request.nextUrl.pathname.startsWith('/api/payment');
  const allowIframe = isEmbed || isPayment;

  const scriptSrc = `'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://www.googletagmanager.com https://www.google-analytics.com`;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nldoyrprekstnifrlblo.supabase.co';
  // Derive wss:// equivalent for Supabase Realtime WebSocket connections
  const supabaseWsUrl = supabaseUrl.replace(/^https:\/\//, 'wss://');

  const cspHeader = `
    default-src 'self';
    script-src ${scriptSrc};
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: ${supabaseUrl} https://images.unsplash.com https://lh3.googleusercontent.com https://www.swiftvenuehq.com;
    font-src 'self' data: https://fonts.gstatic.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-action 'self';
    frame-src 'self' https://swiftvenuehq.com https://www.swiftvenuehq.com https://www.youtube.com https://*.getsafepay.com https://getsafepay.com https://*.getsafepay.pk https://getsafepay.pk https://maps.google.com https://www.google.com;
    frame-ancestors ${allowIframe ? '*' : "'self'"};
    connect-src 'self' ${supabaseUrl} ${supabaseWsUrl} https://*.getsafepay.com https://getsafepay.com https://*.getsafepay.pk https://getsafepay.pk https://unpkg.com https://*.sentry.io https://*.ingest.sentry.io https://nominatim.openstreetmap.org https://api.mapbox.com https://fastly.jsdelivr.net https://www.google-analytics.com;
    media-src 'self' blob: data:;
    worker-src 'self' blob:;
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim()

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', cspHeader)

  const country = request.headers.get('x-vercel-ip-country')
  requestHeaders.set('x-detected-country', country || 'PK')

  const response = await updateSession(request, requestHeaders)

  // Set country cookie for client-side components to avoid headers() on static pages
  response.cookies.set('x-detected-country', country || 'PK')

  response.headers.set('Content-Security-Policy', cspHeader)
  response.headers.set('Access-Control-Allow-Origin', '*')
  if (!allowIframe) {
    response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  }
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=*, microphone=(), geolocation=()')
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  
  // ----------------------------------------------------
  // Virtual Queue Logic (High-Traffic Protection)
  // ----------------------------------------------------
  if (request.nextUrl.pathname.startsWith('/e/') && !request.nextUrl.pathname.includes('/success') && !request.nextUrl.pathname.includes('/feedback')) {
    const slug = request.nextUrl.pathname.split('/')[2];
    
    // In a production environment, this flag would ideally be read from an Edge Config 
    // or Redis store like Upstash for instant global toggle during traffic spikes.
    // Here we use an ENV var and a cookie to simulate clearing the queue.
    const isHighTrafficMode = process.env.ENABLE_VIRTUAL_QUEUE === 'true';
    const hasClearedQueue = request.cookies.get(`swiftvenue_queue_cleared_${slug}`);

    if (slug && isHighTrafficMode && !hasClearedQueue) {
      const url = request.nextUrl.clone();
      url.pathname = '/queue';
      url.searchParams.set('target', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
