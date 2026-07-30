-- MIGRAÇÃO: venda de vídeos (piloto) — preço fixo de R$15, mesma lógica de
-- split de comissão dos eventos (commission_photographer/producer/platform).
-- Execute no SQL Editor do Supabase (projeto do 4dance).

CREATE TABLE IF NOT EXISTS public.videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  photographer_id uuid REFERENCES public.profiles(id),
  storage_path text NOT NULL, -- key do objeto no R2 (sem o prefixo r2://)
  title text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_videos_event_id ON public.videos (event_id);
CREATE INDEX IF NOT EXISTS idx_videos_photographer_id ON public.videos (photographer_id);

CREATE TABLE IF NOT EXISTS public.video_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  event_id uuid REFERENCES public.events(id),
  status text NOT NULL DEFAULT 'pending', -- pending | paid
  amount numeric NOT NULL DEFAULT 15.00,
  stripe_session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_video_orders_user_id ON public.video_orders (user_id);
CREATE INDEX IF NOT EXISTS idx_video_orders_video_id ON public.video_orders (video_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_video_orders_session ON public.video_orders (stripe_session_id) WHERE stripe_session_id IS NOT NULL;

ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_orders ENABLE ROW LEVEL SECURITY;

-- Vídeo é conteúdo de vitrine pública (como as fotos) — qualquer um pode listar.
DROP POLICY IF EXISTS "Videos are publicly readable" ON public.videos;
CREATE POLICY "Videos are publicly readable"
  ON public.videos FOR SELECT
  USING (true);

-- Só o próprio comprador enxerga seus pedidos de vídeo.
DROP POLICY IF EXISTS "Users can view their own video orders" ON public.video_orders;
CREATE POLICY "Users can view their own video orders"
  ON public.video_orders FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own video orders" ON public.video_orders;
CREATE POLICY "Users can create their own video orders"
  ON public.video_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);
