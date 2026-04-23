-- 4DANCE PHOTOGRAPHER MARKETPLACE MIGRATION
-- Execute este script no editor SQL do Supabase

-- 1. Atualizar o papel de usuário para incluir FOTOGRAFO
-- Primeiro removemos a restrição antiga e adicionamos a nova
ALTER TABLE public.user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_role_check;

ALTER TABLE public.user_profiles 
ADD CONSTRAINT user_profiles_role_check 
CHECK (role IN ('ADMIN', 'CLIENT', 'PHOTOGRAPHER'));

-- 2. Adicionar campos de integração com Stripe Connect no perfil
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT false;

-- 3. Adicionar comissão ajustável por evento
-- commission_rate define quanto a PLATAFORMA ganha (ex: 0.10 = 10%)
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(4, 3) DEFAULT 0.100,
ADD COLUMN IF NOT EXISTS photographer_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL;

-- 4. Vincular cada foto a um fotógrafo específico
ALTER TABLE public.photos 
ADD COLUMN IF NOT EXISTS photographer_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL;

-- 5. Comentários para documentação
COMMENT ON COLUMN public.events.commission_rate IS 'Percentual que a plataforma retém da venda (ex: 0.100 para 10%)';
COMMENT ON COLUMN public.user_profiles.stripe_account_id IS 'ID da conta conectada no Stripe Connect';
