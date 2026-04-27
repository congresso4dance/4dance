-- 4DANCE SECURITY HARDENING MIGRATION
-- Objetivo: Unificar perfis e blindar tabelas via RLS

-- 1. Unificação de Tabelas (Garante que profiles seja a fonte da verdade)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        -- Criar 'profiles' se não existir
        CREATE TABLE IF NOT EXISTS public.profiles (
            id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
            full_name TEXT,
            email TEXT,
            role TEXT DEFAULT 'CLIENT',
            avatar_url TEXT,
            stripe_account_id TEXT,
            stripe_onboarding_complete BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );

        -- Migrar dados de user_profiles para profiles
        INSERT INTO public.profiles (id, full_name, role, created_at)
        SELECT id, full_name, role, created_at FROM public.user_profiles
        ON CONFLICT (id) DO UPDATE SET 
            full_name = EXCLUDED.full_name,
            role = EXCLUDED.role;
            
        -- Opcional: DROP TABLE public.user_profiles; 
        -- (Melhor manter por segurança até validar tudo)
    END IF;
END $$;

-- 2. Habilitar RLS em Todas as Tabelas Críticas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de Segurança (Zero-Trust)

-- PROFILES
DROP POLICY IF EXISTS "Perfis: Usuários veem apenas o próprio" ON public.profiles;
CREATE POLICY "Perfis: Usuários veem apenas o próprio" ON public.profiles
FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Perfis: Admins veem tudo" ON public.profiles;
CREATE POLICY "Perfis: Admins veem tudo" ON public.profiles
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'OWNER'))
);

-- PHOTOS
DROP POLICY IF EXISTS "Fotos: Visíveis para todos" ON public.photos;
CREATE POLICY "Fotos: Visíveis para todos" ON public.photos
FOR SELECT USING (true); -- Listagem pública é permitida, download é via API assinada

-- ORDERS
DROP POLICY IF EXISTS "Pedidos: Cliente vê apenas os seus" ON public.orders;
CREATE POLICY "Pedidos: Cliente vê apenas os seus" ON public.orders
FOR SELECT USING (auth.uid() = user_id);

-- CRM ACTIVITIES
DROP POLICY IF EXISTS "CRM: Apenas Admins" ON public.crm_activities;
CREATE POLICY "CRM: Apenas Admins" ON public.crm_activities
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'OWNER'))
);

-- 4. Proteção contra Mass Assignment (Check de Role no Profile)
-- Garante que ninguém mude sua própria role via API pública
CREATE OR REPLACE FUNCTION check_role_update() 
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.role <> NEW.role) AND (NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'OWNER')) THEN
    RAISE EXCEPTION 'Apenas o OWNER pode alterar papéis de usuário.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_check_role_update ON public.profiles;
CREATE TRIGGER tr_check_role_update
BEFORE UPDATE OF role ON public.profiles
FOR EACH ROW EXECUTE FUNCTION check_role_update();
