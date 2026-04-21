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
const META_TOKEN = 'EAAYP6qZCbSZCwBReiLNTLluCVVGMZApFZCTYPaCZCfZBWUO71WWGkp0mUZBLKycrWTK329AaWZBUOJ86j9QZCZC7Ir2KSVHZBSxPDiahNm6JpUonMLcugwiZB66vjsYwYBDGhyISsqdOUYlZAdTNHX73rFzf64YnrZCRtSVjLlWYnik6vb3oTuZBMt27l1bYAHmq13dWL4IaBUIok3Dz0RLMzJxUMWfMiDdur0RIvbcLZBvmTxPDOJ4oHdS6OwZDZD';
const PAGE_ID = '233933363708590';

async function syncAlbumPhotos(albumId, event) {
  let nextUrl = `https://graph.facebook.com/v20.0/${albumId}/photos?fields=id,images,name&access_token=${META_TOKEN}&limit=50`;
  let totalMigrated = 0;

  console.log(`   📸 [${event.title}] Sincronizando fotos...`);

  // Wipe photos for this specific event first to ensure clean versions
  await supabase.from('photos').delete().eq('event_id', event.id);

  while (nextUrl) {
    try {
      const res = await fetch(nextUrl);
      const { data: fbPhotos, paging } = await res.json();

      if (!fbPhotos || fbPhotos.length === 0) break;

      const BATCH_SIZE = 5;
      for (let i = 0; i < fbPhotos.length; i += BATCH_SIZE) {
        const batch = fbPhotos.slice(i, i + BATCH_SIZE);
        
        await Promise.all(batch.map(async (fbPhoto) => {
          try {
            const photoUrl = fbPhoto.images[0].source;
            const response = await fetch(photoUrl);
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const storagePath = `events/${event.slug}/${fbPhoto.id}.jpg`;
            
            await supabase.storage.from('photos').upload(storagePath, buffer, {
              contentType: 'image/jpeg',
              upsert: true
            });

            const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(storagePath);

            await supabase.from('photos').insert({
              event_id: event.id,
              full_res_url: publicUrl,
              thumbnail_url: publicUrl,
              storage_path: storagePath
            });

            totalMigrated++;

            // Periodically update progress in the database (every 10 photos)
            if (totalMigrated % 10 === 0) {
              await supabase.from('events').update({ 
                synced_photos: totalMigrated 
              }).eq('id', event.id);
            }
          } catch (err) {
            console.error(`      ❌ Erro na foto ${fbPhoto.id}:`, err.message);
          }
        }));
      }

      console.log(`      ✅ Parcial: ${totalMigrated} fotos.`);
      nextUrl = paging?.next || null;
    } catch (err) {
      console.error('      ❌ Erro ao buscar lote:', err.message);
      break;
    }
  }

  // Update Event Cover with first photo
  const { data: firstPhoto } = await supabase.from('photos').select('full_res_url').eq('event_id', event.id).limit(1).single();
  if (firstPhoto) {
    await supabase.from('events').update({ cover_url: firstPhoto.full_res_url }).eq('id', event.id);
  }
}

async function runMassiveSync() {
  console.log('🚀 INICIANDO SINCRONIZAÇÃO TOTAL (MODO ELITE)...');

  let allAlbums = [];
  let albumsUrl = `https://graph.facebook.com/v20.0/${PAGE_ID}/albums?fields=id,name,link,created_time,description&access_token=${META_TOKEN}&limit=50`;

  while (albumsUrl) {
    const res = await fetch(albumsUrl);
    const { data: batch, paging } = await res.json();
    if (!batch) break;
    allAlbums = [...allAlbums, ...batch];
    albumsUrl = paging?.next || null;
  }

  allAlbums.sort((a, b) => new Date(b.created_time) - new Date(a.created_time));
  console.log(`📂 Total de álbuns no Facebook: ${allAlbums.length}`);

  for (const album of allAlbums) {
    const slug = album.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/--+/g, '-').trim();

    // Matching logic without dependent fb_id column
    let { data: event } = await supabase
      .from('events')
      .select('id, slug, title')
      .ilike('title', album.name)
      .limit(1)
      .maybeSingle();

    if (!event) {
      console.log(`🆕 Criando novo evento: ${album.name}...`);
      
      // Get total photos count for this album to show progress later
      const countRes = await fetch(`https://graph.facebook.com/v20.0/${album.id}?fields=count&access_token=${META_TOKEN}`);
      const { count: totalPhotos } = await countRes.json();

      const { data: newEvent, error } = await supabase
        .from('events')
        .insert({
          title: album.name,
          slug: `${slug}-${album.id.substring(0, 5)}`,
          description: album.description || `Galeria histórica: ${album.name}`,
          event_date: album.created_time.split('T')[0],
          location: 'Tradicional 4Dance',
          status: 'published',
          total_fb_photos: totalPhotos || 0,
          synced_photos: 0
        })
        .select()
        .single();
      
      if (error) {
        console.error(`   ❌ Erro ao criar:`, error.message);
        continue;
      }
      event = newEvent;
    } else {
      // Update count for existing events too
      const countRes = await fetch(`https://graph.facebook.com/v20.0/${album.id}?fields=count&access_token=${META_TOKEN}`);
      const { count: totalPhotos } = await countRes.json();
      await supabase.from('events').update({ total_fb_photos: totalPhotos || 0 }).eq('id', event.id);
    }

    await syncAlbumPhotos(album.id, event);
  }
  console.log('\n🏆 SINCRONIZAÇÃO TOTAL CONCLUÍDA!');
}

runMassiveSync();
