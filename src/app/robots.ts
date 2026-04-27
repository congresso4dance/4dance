import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/portal-fotografo/configuracoes'],
    },
    sitemap: 'https://4dance.com.br/sitemap.xml',
  }
}
