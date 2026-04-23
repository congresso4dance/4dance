-- COPIE E COLE ESTE CÓDIGO NO SQL EDITOR DO SUPABASE
-- 1. Remove a versão antiga
DROP FUNCTION IF EXISTS match_photo_faces(vector(128), float, int);

-- 2. Cria a nova versão compatível com filtro de eventos
CREATE OR REPLACE FUNCTION match_photo_faces (
  query_embedding vector(128),
  match_threshold float,
  match_count int,
  p_event_id uuid DEFAULT NULL
)
RETURNS TABLE (
  photo_id uuid,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pf.photo_id,
    1 - (pf.embedding <=> query_embedding) AS similarity
  FROM photo_faces pf
  JOIN photos p ON p.id = pf.photo_id
  WHERE 1 - (pf.embedding <=> query_embedding) > match_threshold
  AND (p_event_id IS NULL OR p.event_id = p_event_id)
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
