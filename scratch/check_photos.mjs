import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx), l.slice(idx + 1)];
    })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data: events, error: eventsError } = await supabase.from('events').select('id, title').order('event_date', { ascending: false });
if (eventsError) { console.error('events error:', eventsError); process.exit(1); }
const { data: photos, error: photosError } = await supabase.from('photos').select('event_id, full_res_url');
if (photosError) { console.error('photos error:', photosError); process.exit(1); }

const byEvent = {};
for (const e of events) byEvent[e.id] = { title: e.title, total: 0, inSupabase: 0, hotlinked: 0 };

for (const p of photos) {
  const b = byEvent[p.event_id];
  if (!b) continue;
  b.total++;
  if (p.full_res_url && p.full_res_url.includes('supabase.co/storage')) b.inSupabase++;
  else b.hotlinked++;
}

let totalSupabasePhotos = 0;
for (const id in byEvent) {
  const b = byEvent[id];
  totalSupabasePhotos += b.inSupabase;
  console.log(`${b.title.padEnd(40)} total=${b.total}\tsupabase=${b.inSupabase}\thotlink=${b.hotlinked}`);
}
console.log('\nTOTAL de fotos armazenadas de fato no Supabase Storage (precisam migrar):', totalSupabasePhotos);
