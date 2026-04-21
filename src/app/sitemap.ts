import { MetadataRoute } from 'next';
import { createClient } from '@/utils/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://4dance.com.br';
  const supabase = await createClient();

  // 1. Fetch all public events
  const { data: events } = await supabase
    .from('events')
    .select('slug, updated_at')
    .eq('is_public', true);

  const eventEntries: MetadataRoute.Sitemap = (events || []).map((event) => ({
    url: `${baseUrl}/eventos/${event.slug}`,
    lastModified: event.updated_at ? new Date(event.updated_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // 2. Main pages
  const routes = ['', '/eventos', '/portfolio', '/sobre', '/contrate'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.9,
  }));

  return [...routes, ...eventEntries];
}
