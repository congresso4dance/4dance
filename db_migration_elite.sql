-- 4DANCE ALPHA ELITE MIGRATION
-- Execute este script no editor SQL do Supabase

-- 1. Tabelas de Perfil (Suporte a Clientes e Admins)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    role TEXT DEFAULT 'CLIENT' CHECK (role IN ('ADMIN', 'CLIENT')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS para Perfis
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seus próprios perfis" 
ON public.user_profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seus próprios perfis" 
ON public.user_profiles FOR UPDATE 
USING (auth.uid() = id);

-- 2. Atualização de Eventos (Precificação)
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS photo_price DECIMAL(10, 2) DEFAULT 15.00;

-- 3. Tabela de Pedidos (Vendas)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE SET NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'canceled')),
    items JSONB NOT NULL, -- Array de IDs de fotos
    amount DECIMAL(10, 2) NOT NULL,
    stripe_session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS para Pedidos
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clientes podem ver seus próprios pedidos" 
ON public.orders FOR SELECT 
USING (auth.uid() = user_id);

-- 4. Função Automática de Perfil (Trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'CLIENT');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
