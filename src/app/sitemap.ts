import { MetadataRoute } from 'next'
import { createClient } from '@/utils/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()
  const baseUrl = 'https://4dance.com.br'

  // 1. Fetch public events
  const { data: events } = await supabase
    .from('events')
    .select('slug, updated_at')
    .eq('is_public', true)

  const eventEntries: MetadataRoute.Sitemap = (events || []).map((event) => ({
    url: `${baseUrl}/eventos/${event.slug}`,
    lastModified: event.updated_at || new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/eventos`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    ...eventEntries,
  ]
}
