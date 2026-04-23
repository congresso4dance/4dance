-- 4DANCE PHOTOGRAPHER MARKETPLACE MIGRATION (CORRIGIDA)
-- Execute este script no editor SQL do Supabase

-- 1. Atualizar o papel de usuário para incluir PHOTOGRAPHER na tabela 'profiles' (a que o app usa)
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Garantir que a coluna 'role' aceite 'PHOTOGRAPHER'
-- Se for um ENUM, precisamos de um comando diferente, mas a maioria dos apps usa TEXT com check
ALTER TABLE public.profiles 
ALTER COLUMN role TYPE TEXT; -- Convertendo para text para flexibilidade

-- 2. Adicionar campos de integração com Stripe Connect no perfil
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS custom_rate DECIMAL(4, 3); -- Taxa customizada se quiserem

-- 3. Atualizar a tabela de eventos
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(10, 3) DEFAULT 10.00, -- Percentual (ex: 10.000 para 10%)
ADD COLUMN IF NOT EXISTS photographer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 4. Vincular cada foto a um fotógrafo específico (opcional para rastreio)
ALTER TABLE public.photos 
ADD COLUMN IF NOT EXISTS photographer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 5. Sincronizar dados de user_profiles para profiles (caso o usuário tenha rodado a migração errada antes)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        UPDATE public.profiles p
        SET 
            stripe_account_id = up.stripe_account_id,
            stripe_onboarding_complete = up.stripe_onboarding_complete
        FROM public.user_profiles up
        WHERE p.id = up.id;
    END IF;
END $$;
