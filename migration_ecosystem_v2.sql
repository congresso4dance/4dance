-- 4DANCE ECOSYSTEM V2 MIGRATION
-- Execute este script no editor SQL do Supabase para suportar o novo papel de PRODUTOR

-- 1. Atualizar a restrição de papéis para incluir 'PRODUCER'
-- Nota: Usamos 'profiles' que é a tabela padrão do projeto
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('ADMIN', 'CLIENT', 'PHOTOGRAPHER', 'PRODUCER'));

-- 2. Garantir que os campos de Stripe existam na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT false;

-- 3. Adicionar campos de comissão tripla nos eventos
-- commission_rate: Comissão da Plataforma (ex: 10%)
-- producer_commission: Comissão do Produtor (ex: 5%)
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS producer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS producer_commission DECIMAL(4, 3) DEFAULT 0.050;

-- 4. Permissões de RLS para o novo papel
-- Permitir que produtores vejam seus próprios dados
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Produtores podem ver seus próprios perfis') THEN
        CREATE POLICY "Produtores podem ver seus próprios perfis" 
        ON public.profiles FOR SELECT 
        USING (auth.uid() = id);
    END IF;
END $$;

-- 5. Comentários
COMMENT ON COLUMN public.events.producer_commission IS 'Percentual que o produtor do evento recebe (ex: 0.050 para 5%)';
COMMENT ON COLUMN public.events.producer_id IS 'ID do produtor vinculado ao evento';
