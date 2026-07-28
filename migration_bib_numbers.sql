-- MIGRAÇÃO: busca por número de peito/competidor (bib number)
-- Relevante pra campeonatos de dança com numeração de casal/atleta.
-- Execute no SQL Editor do Supabase (projeto do 4dance).

ALTER TABLE public.photos
ADD COLUMN IF NOT EXISTS bib_numbers TEXT[] NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS numbers_indexed BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_photos_bib_numbers ON public.photos USING GIN (bib_numbers);
CREATE INDEX IF NOT EXISTS idx_photos_numbers_indexed ON public.photos (event_id, numbers_indexed);
