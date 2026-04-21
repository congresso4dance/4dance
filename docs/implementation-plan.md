# Plano de Execução — 4Dance

## Batch 1: Setup & Design System (A Estética Viva)
- Instalação de **Next.js 15 (App Router)**.
- Configuração de **Vanilla CSS (CSS Modules)** para flexibilidade estética.
- Implementação do Design System via CSS Variables (Cores Vibrantes, Tipografia Bold).
- Setup da biblioteca **Framer Motion** para as animações de scroll e transições de página.

## Batch 2: Infraestrutura Supabase & IA-Ready
- Configuração do projeto no Supabase.
- Ativação da extensão `pgvector` para futura busca por reconhecimento facial.
- Modelagem das Tabelas:
  - `events` (id, slug, title, date, location, styles, is_public, password, cover_url).
  - `photos` (id, event_id, storage_path, thumbnail_url, embedding).
  - `testimonials` (id, author, role, content, avatar_url).

## Batch 3: Painel Administrativo (A Operação)
- Implementação de Login para fotógrafo.
- Página de criação de eventos com metadados.
- **Sistema de Bulk Upload**: Integração com o Supabase Storage para upload em massa.
- CRUD simplificado para gestão de álbuns.

## Batch 4: Portal Público (A Vitrine)
- **Home**: Implementação do Hero com vídeo/imagem impactante e CTAs.
- **Lista de Eventos**: Grid criativo com filtros dinâmicos.
- **Página de Álbum**: Visualizador de fotos com Masonry layout e Lazy Loading.
- **Páginas Institucionais**: Sobre, Portfólio curado e Contrate.

## Batch 5: Conversão & SEO
- Integração com WhatsApp e Formulário de orçamento.
- Configuração de Meta Tags Dinâmicas para SEO de cada evento.
- Implementação do Google Analytics e Meta Pixel.

## Batch 6: Otimização & Performance
- Compressão automática de imagens via `next/image`.
- Testes de Lighthouse (Foco em Performance e LCP).
- Ajustes finos em transições e animações de scroll.

## Batch 7: Publicação & Entrega
- Deploy na **Vercel**.
- Testes finais em dispositivos móveis.
- Entrega final do portal vivo 4Dance.
