-- 🛡️ 4Dance Security Hardening Script
-- Implementa Hierarquia de Acesso e Blindagem de Dados Sensíveis

-- 1. Tipos e Tabelas de Perfil
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('owner', 'admin', 'editor', 'assistant', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email text UNIQUE NOT NULL,
    full_name text,
    role public.user_role DEFAULT 'user',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Ativar RLS na Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Funções de Verificação de Segurança
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_role()
RETURNS public.user_role AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Políticas para Profiles
DROP POLICY IF EXISTS "Usuários veem o próprio perfil" ON public.profiles;
CREATE POLICY "Usuários veem o próprio perfil" ON public.profiles 
FOR SELECT USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Apenas Owners gerenciam perfis" ON public.profiles;
CREATE POLICY "Apenas Owners gerenciam perfis" ON public.profiles 
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner')
);

-- 5. Blindagem de Tabelas Existentes (RLS Hardening)

-- PHOTOS & EVENTS
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso público leitura fotos" ON public.photos;
CREATE POLICY "Acesso público leitura fotos" ON public.photos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin full access fotos" ON public.photos;
CREATE POLICY "Admin full access fotos" ON public.photos FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admin full access eventos" ON public.events;
CREATE POLICY "Admin full access eventos" ON public.events FOR ALL USING (public.is_admin());

-- PHOTO_FACES (Dados Biométricos - PROTEÇÃO MÁXIMA)
ALTER TABLE public.photo_faces ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Bloqueio total photo_faces" ON public.photo_faces;
CREATE POLICY "Bloqueio total photo_faces" ON public.photo_faces FOR ALL USING (public.is_admin());

-- CRM & LEADS (Privacidade de Clientes)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leads apenas admin" ON public.leads;
CREATE POLICY "Leads apenas admin" ON public.leads FOR SELECT USING (public.is_admin());

-- SYSTEM SETTINGS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Settings apenas admin" ON public.system_settings;
CREATE POLICY "Settings apenas admin" ON public.system_settings FOR ALL USING (public.is_admin());

-- 6. Trigger para Sincronização Automática de Perfil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- Nota: O trigger em auth.users requer permissões que podem precisar ser rodadas via Dashboard SQL do Supabase.

-- 7. Definir OWNER Inicial (congresso4dance@gmail.com)
-- Como o usuário já existe no auth.users, vamos inserir o perfil dele manualmente
DO $$
DECLARE
    owner_id uuid;
BEGIN
    SELECT id INTO owner_id FROM auth.users WHERE email = 'congresso4dance@gmail.com';
    
    IF owner_id IS NOT NULL THEN
        INSERT INTO public.profiles (id, email, role)
        VALUES (owner_id, 'congresso4dance@gmail.com', 'owner')
        ON CONFLICT (id) DO UPDATE SET role = 'owner';
    END IF;
END $$;
