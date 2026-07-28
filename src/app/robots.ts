import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/api/',
        '/portal-fotografo/',
        '/portal-produtor/',
        '/minha-conta/',
        '/minhas-fotos',
        '/meus-pedidos',
        '/perfil',
        '/redefinir-senha',
      ],
    },
    sitemap: 'https://4dance.com.br/sitemap.xml',
  }
}
