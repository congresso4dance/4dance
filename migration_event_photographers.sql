-- MIGRAÇÃO: múltiplos fotógrafos por evento (self-serve + marketplace)
-- Execute este script no SQL Editor do Supabase (projeto do 4dance).
--
-- Contexto: hoje um evento só pode ter UM fotógrafo (events.photographer_id).
-- Isso impede o modelo "fotógrafo cria o evento e outros fotógrafos entram
-- pra cobrir também, cada um ganhando sobre o que ele mesmo vender" (igual
-- existe na Fotop em Oportunidades > Eventos para fotografar).
--
-- Esta migração:
-- 1. Cria a tabela event_photographers, ligando N fotógrafos a um evento.
-- 2. Adiciona events.open_to_photographers, a flag que faz o evento aparecer
--    no marketplace de "eventos pra fotografar" pros outros fotógrafos.
-- 3. Faz backfill: todo evento que já tem photographer_id ganha uma linha
--    'owner' automaticamente, sem quebrar nada que já existe.
-- 4. Habilita RLS com políticas de leitura/entrada self-serve.

-- 1. Tabela de vínculo evento <-> fotógrafo
CREATE TABLE IF NOT EXISTS public.event_photographers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  photographer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'collaborator' CHECK (role IN ('owner', 'collaborator')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, photographer_id)
);

CREATE INDEX IF NOT EXISTS idx_event_photographers_event ON public.event_photographers(event_id);
CREATE INDEX IF NOT EXISTS idx_event_photographers_photographer ON public.event_photographers(photographer_id);

-- 2. Flag de evento "aberto" no marketplace de oportunidades
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS open_to_photographers BOOLEAN NOT NULL DEFAULT false;

COMMENT ON TABLE public.event_photographers IS 'Fotógrafos vinculados a um evento (dono + colaboradores). Cada um ganha commission_photographer% sobre as próprias vendas (photos.photographer_id).';
COMMENT ON COLUMN public.events.open_to_photographers IS 'Se true, o evento aparece no marketplace de Oportunidades pra outros fotógrafos entrarem sozinhos (self-serve, sem aprovação).';

-- 3. Backfill: eventos existentes com photographer_id viram "owner"
INSERT INTO public.event_photographers (event_id, photographer_id, role)
SELECT id, photographer_id, 'owner'
FROM public.events
WHERE photographer_id IS NOT NULL
ON CONFLICT (event_id, photographer_id) DO NOTHING;

-- 4. RLS
ALTER TABLE public.event_photographers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_photographers' AND policyname = 'Fotografos veem vinculos relevantes') THEN
    CREATE POLICY "Fotografos veem vinculos relevantes"
    ON public.event_photographers FOR SELECT
    TO authenticated
    USING (
      auth.uid() = photographer_id
      OR is_admin()
      OR EXISTS (
        SELECT 1 FROM public.event_photographers owner_row
        WHERE owner_row.event_id = event_photographers.event_id
          AND owner_row.photographer_id = auth.uid()
          AND owner_row.role = 'owner'
      )
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_photographers' AND policyname = 'Fotografo entra em evento aberto') THEN
    CREATE POLICY "Fotografo entra em evento aberto"
    ON public.event_photographers FOR INSERT
    TO authenticated
    WITH CHECK (
      auth.uid() = photographer_id
      AND EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id = event_id AND e.open_to_photographers = true
      )
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_photographers' AND policyname = 'Admin gerencia vinculos') THEN
    CREATE POLICY "Admin gerencia vinculos"
    ON public.event_photographers FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());
  END IF;
END $$;

-- Nota: a tabela audit_logs real deste projeto não tem coluna "metadata"
-- (diferente do que a migração ecosystem_upgrade_v2.sql supunha), então o
-- log de auditoria automático foi removido daqui pra não quebrar a migração
-- inteira por causa de um INSERT que é só cosmético.
