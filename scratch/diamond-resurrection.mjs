import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envPath = './.env.local';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = Object.fromEntries(
  envContent.split('\n').filter(line => line && !line.startsWith('#')).map(line => {
    const [key, ...vals] = line.split('=');
    if (!key) return null;
    return [key.trim(), vals.join('=').trim()];
  }).filter(Boolean)
);

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

async function resurrectPhotos() {
  console.log('💎 Iniciando Operação Ressurreição de Diamantes...');
  
  // 1. Get all events
  const { data: events, error: eventsError } = await supabase.from('events').select('id, slug, title').limit(1000);
  if (eventsError) {
    console.error('❌ Erro ao buscar eventos:', eventsError.message);
    return;
  }

  // 2. Map all folders in photos/events/
  const { data: folders, error: storageError } = await supabase.storage.from('photos').list('events', { limit: 1000 });
  if (storageError) {
    console.error('❌ Erro ao listar pastas no storage:', storageError.message);
    return;
  }

  console.log(`📂 Encontradas ${folders.length} pastas no servidor.`);

  for (const folder of folders) {
    const slug = folder.name;
    const event = events.find(e => e.slug === slug);
    
    if (!event) {
      console.log(`⚠️ Pasta ignoreada (Sem evento correspondente): ${slug}`);
      continue;
    }

    console.log(`🔍 Analisando Álbum: ${event.title} (${slug})...`);

    // 3. List all files in this folder
    const { data: files, error: listError } = await supabase.storage.from('photos').list(`events/${slug}`, { limit: 10000 });
    if (listError) {
      console.error(`❌ Erro ao listar arquivos em ${slug}:`, listError.message);
      continue;
    }

    if (!files || files.length === 0) {
      console.log(`ℹ️ Pasta vazia: ${slug}`);
      continue;
    }

    // 4. Get existing photos in DB for this event to avoid duplicates
    const { data: existingPhotos } = await supabase
      .from('photos')
      .select('storage_path')
      .eq('event_id', event.id);
    
    const existingPaths = new Set(existingPhotos?.map(p => p.storage_path) || []);

    // 5. Prepare photos for insertion
    const photosToInsert = files
      .filter(f => !existingPaths.has(`events/${slug}/${f.name}`) && f.name !== '.emptyFolderPlaceholder')
      .map(file => {
        const path = `events/${slug}/${file.name}`;
        const publicUrl = `${env['NEXT_PUBLIC_SUPABASE_URL']}/storage/v1/object/public/photos/${path}`;
        return {
          event_id: event.id,
          storage_path: path,
          full_res_url: publicUrl,
          thumbnail_url: publicUrl, // Using same for now, can be optimized later
          is_featured: false,
          is_indexed: false,
          created_at: file.created_at
        };
      });

    if (photosToInsert.length === 0) {
      console.log(`✅ Álbum ${event.title} já está sincronizado.`);
      continue;
    }

    console.log(`🚀 Ressuscitando ${photosToInsert.length} fotos para ${event.title}...`);

    // 6. Batch Insert (50 at a time)
    const batchSize = 100;
    for (let i = 0; i < photosToInsert.length; i += batchSize) {
      const batch = photosToInsert.slice(i, i + batchSize);
      const { error: insertError } = await supabase.from('photos').insert(batch);
      if (insertError) {
        console.error(`❌ Erro ao inserir lote em ${event.title}:`, insertError.message);
      }
    }

    // 7. Auto-set cover if missing
    const { data: currentEvent } = await supabase.from('events').select('cover_url').eq('id', event.id).single();
    if (!currentEvent?.cover_url && photosToInsert.length > 0) {
      await supabase.from('events').update({ cover_url: photosToInsert[0].full_res_url }).eq('id', event.id);
      console.log(`🖼️ Capa definida para ${event.title}.`);
    }

    console.log(`✨ Sincronização concluída para ${event.title}!`);
  }

  console.log('\n🏆 OPERAÇÃO RESSURREIÇÃO CONCLUÍDA COM SUCESSO!');
}

resurrectPhotos().catch(err => console.error('💥 Erro fatal:', err));
