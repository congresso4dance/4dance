-- MIGRAÇÃO: página pública do fotógrafo ("Meu Site" dentro do 4dance.com.br)
-- Execute no SQL Editor do Supabase (projeto do 4dance).

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS public_slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS public_page_enabled BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_public_slug ON public.profiles (public_slug) WHERE public_slug IS NOT NULL;
