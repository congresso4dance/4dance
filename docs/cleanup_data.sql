-- =========================================================
-- SCRIPT DE LIMPEZA 4DANCE (REMOÇÃO HERITAGE)
-- Instruções: Copie este código e cole no 'SQL Editor' do seu Supabase Dashboard.
-- =========================================================

-- 1. Limpar títulos e descrições dos Eventos
UPDATE public.events 
SET 
  title = TRIM(REPLACE(title, 'Heritage', '')),
  description = TRIM(REPLACE(description, 'Heritage', ''))
WHERE title LIKE '%Heritage%' OR description LIKE '%Heritage%';

-- 2. Limpar depoimentos (Se existirem)
UPDATE public.testimonials 
SET 
  content = REPLACE(content, 'Heritage', '4Dance'),
  role = REPLACE(role, 'Heritage', '4Dance')
WHERE content LIKE '%Heritage%' OR role LIKE '%Heritage%';

-- 3. Limpar nomes nos Leads (Opcional, apenas se cadastrou com nomes de teste)
UPDATE public.leads 
SET name = REPLACE(name, 'Heritage ', '') 
WHERE name LIKE 'Heritage %';

-- 4. Verificação Final (Deve retornar 0 linhas)
SELECT id, title, description 
FROM public.events 
WHERE title ILIKE '%Heritage%' OR description ILIKE '%Heritage%';
