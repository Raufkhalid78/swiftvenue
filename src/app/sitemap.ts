import { MetadataRoute } from 'next';
import { createServiceClient } from '@/lib/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.swiftvenuehq.com';

  const sitemapEntries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/events`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  try {
    const service = createServiceClient();
    const { data: events } = await service
      .from('events')
      .select('slug, updated_at, status')
      .eq('status', 'published');

    if (events) {
      events.forEach((event) => {
        if (event.slug) {
          sitemapEntries.push({
            url: `${baseUrl}/e/${event.slug}`,
            lastModified: new Date(event.updated_at || new Date()),
            changeFrequency: 'daily',
            priority: 0.8,
          });
        }
      });
    }
  } catch (error) {
    console.error('Error generating sitemap:', error);
  }

  return sitemapEntries;
}
