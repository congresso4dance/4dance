-- 1. Enable pgvector extension for future facial recognition embeddings
create extension if not exists vector;

-- 2. Create Events Table
create table public.events (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  slug text unique not null,
  title text not null,
  event_date date not null,
  location text,
  styles text[], -- Array of dance styles (Zouk, Forró, etc.)
  cover_url text,
  description text,
  is_public boolean default true,
  password text -- Null means no password
);

-- 3. Create Photos Table
create table public.photos (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  event_id uuid references public.events(id) on delete cascade not null,
  storage_path text not null, -- Path inside the bucket
  thumbnail_url text,
  full_res_url text,
  embedding vector(512) -- 512 dimensions for Face Recognition embeddings (v2/future ready)
);

-- 4. Create Testimonials Table
create table public.testimonials (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  author text not null,
  role text, -- e.g. "Organizador" or "Dançarino"
  content text not null,
  avatar_url text
);

-- 5. Row Level Security (RLS) Settings
alter table public.events enable row level security;
alter table public.photos enable row level security;
alter table public.testimonials enable row level security;

-- Policies for public reading
create policy "Allow public read on events" on public.events for select using (is_public = true);
create policy "Allow public read on photos" on public.photos for select using (true);
create policy "Allow public read on testimonials" on public.testimonials for select using (true);

-- Admin policies (assuming service role or specific uid)
-- Note: Replace 'admin-uid' with actual admin uid if not using service role for panel
create policy "Full access for authenticated admins" on public.events for all using (auth.role() = 'authenticated');
create policy "Full access for authenticated admins" on public.photos for all using (auth.role() = 'authenticated');
create policy "Full access for authenticated admins" on public.testimonials for all using (auth.role() = 'authenticated');

-- 6. Storage Buckets (Run via Supabase Dashboard or API)
-- Need to manually create bucket 'event-photos' and 'assets'

-- 7. Marketing & Leads
CREATE TABLE public.leads (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  name text not null,
  email text not null,
  whatsapp text,
  source_event_slug text -- Slug of the event where the lead was captured
);

CREATE TABLE public.event_alerts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  lead_id uuid references public.leads(id) on delete cascade not null,
  event_slug text not null,
  notified boolean default false
);

-- RLS for leads (Allow public insert, admin read)
alter table public.leads enable row level security;
alter table public.event_alerts enable row level security;

create policy "Allow public insert on leads" on public.leads for insert with check (true);
create policy "Allow admin read on leads" on public.leads for select using (auth.role() = 'authenticated');

create policy "Allow public insert on alerts" on public.event_alerts for insert with check (true);
create policy "Allow admin read on alerts" on public.event_alerts for select using (auth.role() = 'authenticated');

-- 8. Face Recognition Vector Support
CREATE TABLE IF NOT EXISTS public.photo_faces (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_id uuid REFERENCES public.photos(id) ON DELETE CASCADE,
  embedding vector(128),
  created_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION match_photo_faces (
  query_embedding vector(128),
  match_threshold float,
  match_count int
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
  WHERE 1 - (pf.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
