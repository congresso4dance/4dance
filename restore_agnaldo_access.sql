-- 4DANCE ACCESS FIX
-- Objetivo: Garantir que o Agnaldo tenha acesso total ao Admin Dashboard.

-- 1. Cria ou Atualiza o perfil do Agnaldo como 'owner'
INSERT INTO public.profiles (id, full_name, email, role)
VALUES (
  '18d62bcb-15d8-435c-8dc1-ede6011a982b', 
  'Agnaldo 4Dance', 
  'congresso4dance@gmail.com', 
  'owner'
)
ON CONFLICT (id) DO UPDATE 
SET role = 'owner', email = 'congresso4dance@gmail.com';

-- 2. Audit Log
INSERT INTO public.audit_logs (action, table_name, metadata)
VALUES ('ACCESS_RESTORATION', 'profiles', jsonb_build_object('user', 'congresso4dance@gmail.com', 'role', 'owner'));
