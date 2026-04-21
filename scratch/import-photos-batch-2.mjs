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
  {
    event_id: "67373f1f-45a2-4a7b-a25a-45c115915993", // LambaSwag
    photos: ["https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/540598758_1345761817553463_7372628731442920752_n.jpg", "https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/542016406_1345761904220121_2158494256649764701_n.jpg"]
  },
  {
    event_id: "e722883a-f38b-4b11-a877-628f2f2be315", // Congresso Gerações
    photos: ["https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/524703878_1312508034212175_1103267762041026692_n.jpg", "https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/524116041_1312508047545507_8692992423129880565_n.jpg"]
  },
  {
    event_id: "bd089a81-e28a-4db3-982c-4740f9f3ec61", // Aniversario Planet 2025
    photos: ["https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/506439330_1270957688367210_2177977591992207934_n.jpg", "https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/505749122_1270957725033873_2000615130677994122_n.jpg"]
  },
  {
    event_id: "4a71f00a-ced2-4014-99ed-cd3d191244ab", // Samba ao Quadrado
    photos: ["https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/495342940_1241893057940340_6004905221327199222_n.jpg", "https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/495862859_1241890977940548_8213593166215749671_n.jpg"]
  },
  {
    event_id: "75c30fb8-18e4-4d8b-968e-49b0621f3764", // Dançart
    photos: ["https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/492946730_1232555942207385_7451407804365090362_n.jpg", "https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/493966852_1232555982207381_6149047570053718656_n.jpg"]
  },
  {
    event_id: "936087bc-d39b-449e-b7ca-470a1fa1fa62", // Olimpo Ultimo Baile
    photos: ["https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/492631853_1232550812207898_3164592798052015721_n.jpg", "https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/493942650_1232550652207914_2546365437620461073_n.jpg"]
  },
  {
    event_id: "7616238b-8a21-4f18-bc1c-595461cfa7c4", // Forro a Bordo 2024
    photos: ["https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/493318215_1232328935563419_7634134053721038060_n.jpg", "https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/492982949_1232329772230002_1334691766937413130_n.jpg"]
  },
  {
    event_id: "848bd103-625d-4f1c-9226-9d62da3f6f1c", // Q Baile Nov
    photos: ["https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/492540520_1231852038944442_5143426178236738989_n.jpg", "https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/492567681_1231852328944413_5704260795288587158_n.jpg"]
  },
  {
    event_id: "a9010444-6725-4672-8874-9b5d44d6738b", // Olimpo Halloween
    photos: ["https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/492393575_1231318028997843_3980716816373723496_n.jpg", "https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/492499318_1231318122331167_8627540997233155816_n.jpg"]
  }
];

async function importPhotosBatch2() {
  console.log('📸 Iniciando importação do Lote 2 (10 Eventos)...');
  
  for (const item of batchData) {
    if (!item.event_id) continue;
    console.log(`Preenchendo evento ${item.event_id}...`);
    
    const photosToInsert = item.photos.map(url => ({
      event_id: item.event_id,
      full_res_url: url,
      thumbnail_url: url
    }));
    
    const { error: photoError } = await supabase.from('photos').insert(photosToInsert);
    if (photoError) console.error(`Erro ao inserir fotos:`, photoError.message);
    
    await supabase.from('events').update({
      cover_url: item.photos[0]
    }).eq('id', item.event_id);
  }
  
  console.log('✅ Lote 2 importado com sucesso!');
}

importPhotosBatch2();
