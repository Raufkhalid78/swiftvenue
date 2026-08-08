import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {

  const nonce = crypto.randomUUID()
  const isDev = process.env.NODE_ENV !== 'production'
  
  // Next.js requires 'unsafe-eval' in development for HMR
  const scriptSrc = isDev
    ? `'self' 'unsafe-eval' 'unsafe-inline' https://unpkg.com`
    : `'self' 'nonce-${nonce}' 'strict-dynamic' https://unpkg.com`

  const cspHeader = `
    default-src 'self';
    script-src ${scriptSrc};
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https://nldoyrprekstnifrlblo.supabase.co https://images.unsplash.com https://lh3.googleusercontent.com;
    font-src 'self' data: https://fonts.gstatic.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-src 'self' https://www.youtube.com https://*.getsafepay.com https://getsafepay.com https://*.getsafepay.pk https://getsafepay.pk https://maps.google.com https://www.google.com;
    frame-ancestors 'none';
    connect-src 'self' https://nldoyrprekstnifrlblo.supabase.co https://*.getsafepay.com https://getsafepay.com https://*.getsafepay.pk https://getsafepay.pk https://unpkg.com https://*.sentry.io https://*.ingest.sentry.io;
    worker-src 'self' blob:;
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim()

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', cspHeader)

  const response = await updateSession(request, requestHeaders)

  response.headers.set('Content-Security-Policy', cspHeader)
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  
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
