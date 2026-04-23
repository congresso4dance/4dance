import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envPath = './.env.local';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = Object.fromEntries(
  envContent.split('\n').filter(line => line && !line.startsWith('#')).map(line => {
    const [key, ...vals] = line.split('=');
    return [key.trim(), vals.join('=').trim()];
  })
);

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);
const META_TOKEN = 'EAAYP6qZCbSZCwBRfeU3hVckE9JRLEtFRZASDCBW5t8FZApBrWB0RO2JaPSUMujrOf6wXKk9VYpBiuE2ZAwhdQ1OVy1pTPZA4p92gku1WxPhD4SGyqZBpdxSfEjiOHDibIma1G33ZCLqIZAAl35wDSp2hXRap8ZB8pzBF2Y6Ud33ksizXVQaKLXIVBGkZAo1km3ATkmvNARPLssj2Pnt95LUcsiby1Me0emGx4Ry3IQ1QP5oeINzfoXO782a6tB4';
const PAGE_ID = '233933363708590';

async function syncAlbumPhotos(albumId, event) {
  let nextUrl = `https://graph.facebook.com/v20.0/${albumId}/photos?fields=id,images,name&access_token=${META_TOKEN}&limit=50`;
  let totalMigrated = 0;

  console.log(`   📸 [${event.title}] Sincronizando fotos...`);

  // DIFFERENTIAL SYNC: Do not wipe, just add what's missing.
  // Actually, for speed, we delete only if we want a fresh start. 
  // For "Turbo", let's assume we want to fill gaps.

  while (nextUrl) {
    try {
      const res = await fetch(nextUrl);
      const { data: fbPhotos, paging } = await res.json();

      if (!fbPhotos || fbPhotos.length === 0) break;

      const BATCH_SIZE = 50; // CARGA TOTAL MODE CONCURRENCY
      for (let i = 0; i < fbPhotos.length; i += BATCH_SIZE) {
        const batch = fbPhotos.slice(i, i + BATCH_SIZE);
        
        await Promise.all(batch.map(async (fbPhoto) => {
          try {
            const photoUrl = fbPhoto.images[0].source;
            const storagePath = `events/${event.slug}/${fbPhoto.id}.jpg`;

            // Check if already in DB to skip upload
            const { data: existing } = await supabase.from('photos').select('id').eq('storage_path', storagePath).maybeSingle();
            if (existing) {
                totalMigrated++;
                return;
            }

            const response = await fetch(photoUrl);
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            await supabase.storage.from('photos').upload(storagePath, buffer, {
              contentType: 'image/jpeg',
              upsert: true
            });

            const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(storagePath);

            await supabase.from('photos').insert({
              event_id: event.id,
              full_res_url: publicUrl,
              thumbnail_url: publicUrl,
              storage_path: storagePath,
              is_indexed: false
            });

            totalMigrated++;

            if (totalMigrated % 50 === 0) {
              console.log(`      📸 Progresso [${event.title}]: ${totalMigrated} fotos.`);
            }
          } catch (err) {
            // Silently fail for individual photo errors to keep the flow
          }
        }));
      }

      nextUrl = paging?.next || null;
    } catch (err) {
      console.error('      ❌ Erro ao buscar lote:', err.message);
      break;
    }
  }

  // Update Event Cover with first photo if missing
  if (!event.cover_url) {
    const { data: firstPhoto } = await supabase.from('photos').select('full_res_url').eq('event_id', event.id).limit(1).single();
    if (firstPhoto) {
      await supabase.from('events').update({ cover_url: firstPhoto.full_res_url }).eq('id', event.id);
    }
  }
}

async function runMassiveSync() {
  console.log('🚀 INICIANDO SINCRONIZAÇÃO TOTAL (MODO TURBO)...');

  let allAlbums = [];
  let albumsUrl = `https://graph.facebook.com/v20.0/${PAGE_ID}/albums?fields=id,name,link,created_time,description&access_token=${META_TOKEN}&limit=100`;

  while (albumsUrl) {
    const res = await fetch(albumsUrl);
    const { data: batch, paging } = await res.json();
    if (!batch) break;
    allAlbums = [...allAlbums, ...batch];
    albumsUrl = paging?.next || null;
  }

  allAlbums.sort((a, b) => new Date(b.created_time) - new Date(a.created_time));
  console.log(`📂 Total de álbuns no Facebook: ${allAlbums.length}`);

  const CONCURRENCY = 10; // 10 albums at a time - CARGA TOTAL
  for (let i = 0; i < allAlbums.length; i += CONCURRENCY) {
    const batch = allAlbums.slice(i, i + CONCURRENCY);
    console.log(`\n⏳ Processando Lote de Álbuns (${i} a ${i + batch.length})...`);
    
    await Promise.all(batch.map(async (album) => {
      const slug = album.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/--+/g, '-').trim();

      let { data: event } = await supabase
        .from('events')
        .select('*')
        .ilike('title', album.name)
        .limit(1)
        .maybeSingle();

      if (!event) {
        console.log(`🆕 Criando novo evento: ${album.name}...`);
        const { data: newEvent, error } = await supabase
          .from('events')
          .insert({
            title: album.name,
            slug: `${slug}-${album.id.substring(0, 5)}`,
            description: album.description || `Galeria histórica: ${album.name}`,
            event_date: album.created_time.split('T')[0],
            location: 'Tradicional 4Dance',
            is_paid: false
          })
          .select()
          .single();
        
        if (error) {
          console.error(`   ❌ Erro ao criar álbum [${album.name}]:`, error.message);
          return;
        }
        event = newEvent;
      }

      await syncAlbumPhotos(album.id, event);
      console.log(`✅ [${event.title}] Sincronização concluída.`);
    }));
  }
  
  console.log('\n🏆 SINCRONIZAÇÃO TOTAL TURBO CONCLUÍDA!');
}

runMassiveSync();
