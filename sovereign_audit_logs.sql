-- 4DANCE ELITE SOVEREIGN SECURITY: IMMUTABLE AUDIT LOGS
-- Objetivo: Garantir que nenhuma ação administrativa passe despercebida e que os logs sejam impossíveis de apagar.

-- 1. Tabela de Logs de Auditoria
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    user_email TEXT,
    action TEXT NOT NULL,
    table_name TEXT,
    record_id TEXT,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Blindagem de RLS: Ninguém (nem admin) pode apagar ou editar logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Logs: Apenas leitura para OWNER" ON public.audit_logs;
CREATE POLICY "Logs: Apenas leitura para OWNER" ON public.audit_logs
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'OWNER')
);

-- Bloqueia INSERT/UPDATE/DELETE para todos (apenas o sistema via SECURITY DEFINER pode inserir)
DROP POLICY IF EXISTS "Logs: Sistema insere" ON public.audit_logs;
-- Nota: INSERTs via funções security definer ignoram RLS se configuradas corretamente.

-- 3. Função de Log Automático para Tabelas Críticas (Ex: Orders, Profiles, Events)
CREATE OR REPLACE FUNCTION process_audit_log() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_logs (
        user_id,
        action,
        table_name,
        record_id,
        old_data,
        new_data
    ) VALUES (
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        CASE WHEN TG_OP = 'DELETE' THEN OLD.id::text ELSE NEW.id::text END,
        CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
        CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END
    );
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Aplicar Gatilhos de Auditoria
-- Ordens de Compra
DROP TRIGGER IF EXISTS tr_audit_orders ON public.orders;
CREATE TRIGGER tr_audit_orders
AFTER INSERT OR UPDATE OR DELETE ON public.orders
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- Perfis e Roles
DROP TRIGGER IF EXISTS tr_audit_profiles ON public.profiles;
CREATE TRIGGER tr_audit_profiles
AFTER UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- Configurações de Eventos
DROP TRIGGER IF EXISTS tr_audit_events ON public.events;
CREATE TRIGGER tr_audit_events
AFTER UPDATE OR DELETE ON public.events
FOR EACH ROW EXECUTE FUNCTION process_audit_log();
