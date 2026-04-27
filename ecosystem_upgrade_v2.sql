-- 4DANCE ECOSYSTEM EVOLUTION (V2)
-- Objetivo: Implementar sistema de Comissões, Role de Produtor e Rastreamento Financeiro.

-- 1. Extender o tipo ENUM de roles (se necessário) ou garantir a existência
-- Nota: Supabase as vezes exige comandos específicos para alterar ENUMS, 
-- mas vamos usar uma abordagem segura via tabela de perfis.

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('admin', 'owner', 'editor', 'assistant', 'PHOTOGRAPHER', 'PRODUCER', 'user');
    END IF;
END $$;

-- 2. Atualizar a tabela de EVENTOS para o Motor de Comissões
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS producer_id UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS commission_photographer DECIMAL(5,2) DEFAULT 70.00,
ADD COLUMN IF NOT EXISTS commission_producer DECIMAL(5,2) DEFAULT 15.00,
ADD COLUMN IF NOT EXISTS commission_platform DECIMAL(5,2) DEFAULT 15.00,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived'));

-- 3. Criar Tabela de TRANSAÇÕES FINANCEIRAS (Splits)
-- Esta tabela guarda o registro histórico de cada divisão de lucro
CREATE TABLE IF NOT EXISTS public.revenue_splits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.events(id),
    total_amount DECIMAL(10,2) NOT NULL,
    
    photographer_id UUID REFERENCES public.profiles(id),
    photographer_amount DECIMAL(10,2) NOT NULL,
    
    producer_id UUID REFERENCES public.profiles(id),
    producer_amount DECIMAL(10,2) DEFAULT 0.00,
    
    platform_amount DECIMAL(10,2) NOT NULL,
    
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'refunded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Habilitar RLS para as novas tabelas
ALTER TABLE public.revenue_splits ENABLE ROW LEVEL SECURITY;

-- Políticas para Splits
CREATE POLICY "Photographers see their own splits" 
ON public.revenue_splits FOR SELECT 
TO authenticated 
USING (auth.uid() = photographer_id OR is_admin());

CREATE POLICY "Producers see their own splits" 
ON public.revenue_splits FOR SELECT 
TO authenticated 
USING (auth.uid() = producer_id OR is_admin());

-- 5. Audit Log do Upgrade
INSERT INTO public.audit_logs (action, table_name, metadata)
VALUES ('ECOSYSTEM_UPGRADE_V2', 'multiple', jsonb_build_object('version', '2.0.0', 'features', 'producer_role, commission_engine'));
