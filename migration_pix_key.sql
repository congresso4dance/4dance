-- MIGRAÇÃO: chave Pix de emergência do fotógrafo (Configurações > Pagamentos & Saques)
-- Execute no SQL Editor do Supabase (projeto do 4dance).
-- Causa do erro "Erro ao salvar chave Pix": a coluna pix_key nunca foi criada na tabela profiles.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS pix_key TEXT;
