-- 4DANCE AI ENGINE PERFORMANCE TURBO
-- Execute este script no editor SQL do Supabase para destravar o processamento de IA

-- 1. Criar índice parcial para fotos pendentes (Extremamente rápido para o robô)
CREATE INDEX IF NOT EXISTS idx_photos_pending_processing 
ON public.photos (id) 
WHERE is_indexed = false;

-- 2. Criar índice global para estatísticas
CREATE INDEX IF NOT EXISTS idx_photos_indexed_status 
ON public.photos (is_indexed);

-- 3. Aumentar a velocidade de contagem de fotos (opcional, melhora o painel)
ANALYZE public.photos;

-- 4. Comentário de sucesso
COMMENT ON INDEX idx_photos_pending_processing IS 'Otimiza a busca do robô de IA por fotos não processadas';
