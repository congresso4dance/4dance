-- 4DANCE PERFORMANCE TURBO V2: ADVANCED INDEXING
-- Objetivo: Garantir buscas instantâneas e escalabilidade para milhões de fotos.

-- 1. Índices para Busca de Fotos (Performance de Galeria)
CREATE INDEX IF NOT EXISTS idx_photos_event_created 
ON public.photos (event_id, created_at DESC);

-- 2. Índices para Filtros de Status (Dashboard e IA)
CREATE INDEX IF NOT EXISTS idx_photos_processing_queue 
ON public.photos (is_indexed, event_id) 
WHERE is_indexed = false;

-- 3. Índices para Pedidos e Vendas (Relatórios Rápidos)
CREATE INDEX IF NOT EXISTS idx_orders_user_status 
ON public.orders (user_id, status);

CREATE INDEX IF NOT EXISTS idx_orders_created_at 
ON public.orders (created_at DESC);

-- 4. Índice para CRM (Busca por e-mail e atividade)
CREATE INDEX IF NOT EXISTS idx_crm_email_action 
ON public.crm_activities (email, action_type);

-- 5. Otimização de Busca Vetorial (Se usar pgvector)
-- Se a extensão vector estiver ativa e a coluna embedding existir:
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        -- Índice HNSW para busca por similaridade (Requer pgvector 0.5.0+)
        -- CREATE INDEX ON public.photo_faces USING hnsw (embedding vector_cosine_ops);
        -- (Comentado por segurança até confirmar a versão do pgvector)
        NULL;
    END IF;
END $$;

-- 6. Atualizar estatísticas para o planejador de consultas
ANALYZE public.photos;
ANALYZE public.orders;
ANALYZE public.profiles;
