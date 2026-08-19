import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

const RESERVED_SLUGS = new Set([
  'admin',
  'dashboard',
  'api',
  'auth',
  'pricing',
  'blog',
  'contact',
  'about',
  'events',
  'terms',
  'privacy',
  'claim',
  'embed',
  'ticket',
  'tickets',
  'settings',
  'analytics',
  'login',
  'signup',
  'not-found',
]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawSlug = searchParams.get('slug');
  const excludeId = searchParams.get('excludeId');

  if (!rawSlug) {
    return NextResponse.json({ available: false, error: 'Slug parameter is required' }, { status: 400 });
  }

  const cleanSlug = rawSlug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  if (cleanSlug.length < 3) {
    return NextResponse.json({
      available: false,
      slug: cleanSlug,
      reason: 'Slug must be at least 3 characters long',
    });
  }

  if (RESERVED_SLUGS.has(cleanSlug)) {
    return NextResponse.json({
      available: false,
      slug: cleanSlug,
      reason: 'This URL is reserved by SwiftVenue',
      suggestion: `${cleanSlug}-${new Date().getFullYear()}`,
    });
  }

  const service = createServiceClient();
  let query = service.from('events').select('id, slug').eq('slug', cleanSlug);

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data: existing, error } = await query.maybeSingle();

  if (error) {
    console.error('Error checking slug:', error);
    return NextResponse.json({ error: 'Database check failed' }, { status: 500 });
  }

  if (existing) {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const suggestion = `${cleanSlug}-${randomSuffix}`;
    return NextResponse.json({
      available: false,
      slug: cleanSlug,
      reason: 'This custom URL is already in use by another event',
      suggestion,
    });
  }

  return NextResponse.json({
    available: true,
    slug: cleanSlug,
  });
}
