-- 4DANCE INTEGRITY HARDENING
-- Objetivo: Prevenir duplicidade de compras e garantir integridade de dados.

-- 1. Unicidade em Itens de Pedido
-- Impede que a mesma foto seja adicionada duas vezes ao mesmo pedido
ALTER TABLE public.order_items 
ADD CONSTRAINT unique_order_photo UNIQUE (order_id, photo_id);

-- 2. Unicidade em Perfis (Garantia Extra além da PK)
-- Garante que o ID do usuário seja único na tabela de perfis (já é PK, mas reforça consistência)
-- ALTER TABLE public.profiles ADD CONSTRAINT unique_profile_user UNIQUE (id);

-- 3. Índice para Performance de Filtro por Data
CREATE INDEX IF NOT EXISTS idx_orders_payment_date ON public.orders (created_at) WHERE status = 'paid';

-- 4. Log de Integridade no Auditor
INSERT INTO public.audit_logs (action, table_name, metadata)
VALUES ('HARDENING', 'database', jsonb_build_object('type', 'Integrity Constraints Added'));
