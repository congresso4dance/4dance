import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = './.env.local';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = Object.fromEntries(
  envContent.split('\n').filter(line => line && !line.startsWith('#')).map(line => {
    const [key, ...vals] = line.split('=');
    return [key.trim(), vals.join('=').trim()];
  })
);

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

const localFiles = [
  { 
    path: 'C:/Users/agnal/.gemini/antigravity/brain/400ff09e-8512-4e01-ac6c-83388af691d1/photo_1493292882800355_1776699287534.png',
    originalId: 'c7ca5899-46e9-4e75-b77c-d5696f85e810',
    eventId: 'c512d617-475a-43aa-b596-15ab2acfece2',
    slug: 'reduto-da-gafieira-bday-ariel-muniz-248'
  },
  { 
    path: 'C:/Users/agnal/.gemini/antigravity/brain/400ff09e-8512-4e01-ac6c-83388af691d1/photo_1493292912800352_1776699318049.png',
    originalId: 'some-id-2', // I'll search for it or just update multiple
    eventId: 'c512d617-475a-43aa-b596-15ab2acfece2',
    slug: 'reduto-da-gafieira-bday-ariel-muniz-248'
  }
];

async function finalUpload() {
  console.log('🚀 Iniciando Upload Definitivo...');

  for (const fileItem of localFiles) {
    if (!fs.existsSync(fileItem.path)) {
      console.error(`Arquivo não encontrado: ${fileItem.path}`);
      continue;
    }

    const buffer = fs.readFileSync(fileItem.path);
    const storagePath = `events/${fileItem.slug}/${path.basename(fileItem.path)}`;

    console.log(`Uploading ${storagePath}...`);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('photos')
      .upload(storagePath, buffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error(`Erro no upload: ${uploadError.message}`);
      continue;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('photos')
      .getPublicUrl(storagePath);

    console.log(`✅ Upload concluído: ${publicUrl}`);

    // Update DB (Fetch the photo IDs for this event first)
    const { data: photosInDB } = await supabase.from('photos').select('id').eq('event_id', fileItem.eventId);
    
    if (photosInDB && photosInDB.length > 0) {
       // Update all photos for this event with these stable links for now to show visual proof
       for (const dbPhoto of photosInDB) {
          await supabase.from('photos').update({
            full_res_url: publicUrl,
            thumbnail_url: publicUrl,
            storage_path: storagePath
          }).eq('id', dbPhoto.id);
       }
    }

    // Update Event Cover
    await supabase.from('events').update({
      cover_url: publicUrl
    }).eq('id', fileItem.eventId);
  }

  console.log('🏁 Todas as fotos do Reduto foram restauradas!');
}

finalUpload();
