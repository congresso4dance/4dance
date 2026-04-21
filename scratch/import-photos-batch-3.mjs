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

const batchData = [
  { id: "d9ffc454-5f1d-411d-8509-9bd1968ecaa2", photos: ["https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/492674258_1230866345709678_7158491835130076951_n.jpg", "https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/493323893_1230866629042983_1158315799739300158_n.jpg"] },
  { id: "5a1ff12c-c829-4fdd-b449-4f04ee51a925", photos: ["https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/490471276_1220214616774851_6524301639915389198_n.jpg"] },
  { id: "9555d630-f7d8-4eea-b734-6db6ea0b01ae", photos: ["https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/490083049_1219088443554135_5692637987818594970_n.jpg"] },
  { id: "f1df3364-506f-477d-9248-83cf95150d20", photos: ["https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/490271896_1218584323604547_653874559621254009_n.jpg"] },
  { id: "d745ec1f-ad0c-49ee-8292-3d03107fa2bd", photos: ["https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/489828985_1217152537081059_1548153085568244811_n.jpg"] },
  { id: "16558c57-42b7-41aa-b3c4-e46753e6abab", photos: ["https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/490961447_1222209556575357_2879703476511016910_n.jpg"] },
  { id: "c55ce384-cb31-432a-b7ae-a912255332ea", photos: ["https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/490754910_1223139913148988_646255480790861107_n.jpg"] },
  { id: "bbebbab7-7f0b-4296-8fc6-766171ab26f3", photos: ["https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/490742038_1223532663109713_5998938883331984738_n.jpg", "https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/490410270_1223532629776383_5256160723182090017_n.jpg"] },
  { id: "4b6f9e6f-10af-4bc5-873c-c2e8096f2b5a", photos: ["https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/490977444_1222036069926039_8079847147274868492_n.jpg"] },
  { id: "c5bbabdf-276c-4390-b8c6-da6163fb8bb9", photos: ["https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/490593298_1219090656887247_744426826347295065_n.jpg"] },
  { id: "45c278ea-e638-49cd-aee8-6fd486c5de4c", photos: ["https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/490184132_1219726270157019_2196187274770254155_n.jpg"] },
  { id: "10d779b5-56fc-43e3-9c05-32fa7a1989f2", photos: ["https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/493115969_1229918752471104_7198029903153680632_n.jpg", "https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/493314656_1229918475804465_3570731590666290119_n.jpg"] },
  { id: "9b21bd4b-ebe8-46e5-9b8d-56678b13a76f", photos: ["https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/492032332_1230423885753924_1203883758893697595_n.jpg", "https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/492396277_1230424222420557_8487930182144294479_n.jpg"] },
  { id: "a6dce3a0-8019-462c-af69-ffdfb75fc506", photos: ["https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/492553770_1231255165670796_1913762656459552516_n.jpg", "https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/492104937_1231255215670791_3800048220660357645_n.jpg"] }
];

async function importBatch3() {
  console.log('📸 Iniciando Importação do Lote 3 (14 Eventos)...');
  
  for (const item of batchData) {
    if (!item.id) continue;
    console.log(`Preenchendo: ${item.id}...`);
    
    // Insert photos
    const photosToInsert = item.photos.map(url => ({
      event_id: item.id,
      full_res_url: url,
      thumbnail_url: url
    }));
    
    const { error: photoError } = await supabase.from('photos').insert(photosToInsert);
    if (photoError) console.error(`Erro ao inserir fotos para ${item.id}:`, photoError.message);
    
    // Update cover
    await supabase.from('events').update({
      cover_url: item.photos[0]
    }).eq('id', item.id);
  }
  
  console.log('✅ Sucesso! Lote 3 finalizado.');
}

importBatch3();
