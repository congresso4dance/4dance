-- 4DANCE STORAGE SECURITY: ISOLAMENTO DE FOTÓGRAFOS
-- Objetivo: Garantir que cada fotógrafo acesse apenas seus próprios arquivos no Storage.

-- 1. Habilitar RLS no Storage (se não estiver)
-- Nota: O Supabase gerencia RLS na tabela storage.objects

-- 2. Política para Fotos de Eventos (Upload)
-- Apenas fotógrafos autenticados podem subir fotos para pastas com seu próprio ID
DROP POLICY IF EXISTS "Fotógrafos: Upload próprio" ON storage.objects;
CREATE POLICY "Fotógrafos: Upload próprio" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'event-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'PHOTOGRAPHER')
);

-- 3. Política para Fotos de Eventos (Leitura)
-- Público pode ver fotos (para listagem), mas o download em alta é via URL assinada
DROP POLICY IF EXISTS "Público: Ver fotos" ON storage.objects;
CREATE POLICY "Público: Ver fotos" ON storage.objects
FOR SELECT USING (bucket_id = 'event-photos');

-- 4. Política para Fotos de Eventos (Delete)
-- Apenas o dono da pasta pode deletar
DROP POLICY IF EXISTS "Fotógrafos: Delete próprio" ON storage.objects;
CREATE POLICY "Fotógrafos: Delete próprio" ON storage.objects
FOR DELETE USING (
  bucket_id = 'event-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. LGPD: Auto-Cleanup Procedure
-- Cria uma função que pode ser chamada por uma Cron Job para limpar dados sensíveis
CREATE OR REPLACE FUNCTION public.cleanup_expired_embeddings()
RETURNS void AS $$
BEGIN
    -- Remove embeddings de fotos de eventos encerrados há mais de 60 dias
    DELETE FROM public.photo_faces
    WHERE photo_id IN (
        SELECT p.id FROM public.photos p
        JOIN public.events e ON p.event_id = e.id
        WHERE e.date < (now() - interval '60 days')
    );
    
    -- Log da limpeza no Audit Log
    INSERT INTO public.audit_logs (action, table_name, metadata)
    VALUES ('CLEANUP', 'photo_faces', jsonb_build_object('reason', 'LGPD Compliance', 'interval', '60 days'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
