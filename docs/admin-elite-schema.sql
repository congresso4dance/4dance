-- 1. Tabela de Logs de Busca (Métricas de Engajamento)
CREATE TABLE IF NOT EXISTS public.search_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now(),
    event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
    search_type text DEFAULT 'facial', -- 'facial' ou 'manual'
    success boolean DEFAULT true,
    results_count int DEFAULT 0,
    user_ip text, -- Para localização geográfica simplificada
    user_agent text
);

-- 2. Tabela de Auditoria Administrativa (Segurança)
CREATE TABLE IF NOT EXISTS public.admin_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now(),
    admin_id uuid, -- Referência ao auth.users se necessário
    admin_email text,
    action text NOT NULL, -- 'CREATE_EVENT', 'DELETE_PHOTO', 'CHANGE_SETTING', etc.
    details jsonb, -- Dados técnicos da ação
    target_id text -- ID do evento ou foto afetada
);

-- 3. Tabela de Configurações Globais
CREATE TABLE IF NOT EXISTS public.system_settings (
    key text PRIMARY KEY,
    value jsonb DEFAULT '{}'::jsonb,
    updated_at timestamptz DEFAULT now()
);

-- Inserir configurações iniciais
INSERT INTO public.system_settings (key, value)
VALUES 
    ('ai_config', '{"match_threshold": 0.92, "gemini_enabled": true, "max_search_results": 100}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 4. RLS para novas tabelas
ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Apenas admins autenticados podem ver logs
CREATE POLICY "Admins can view search logs" ON public.search_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Public can insert search logs" ON public.search_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage admin logs" ON public.admin_logs FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage settings" ON public.system_settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Public can view non-sensitive settings" ON public.system_settings FOR SELECT USING (true);
