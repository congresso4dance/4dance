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
  { id: "c512d617-475a-43aa-b596-15ab2acfece2", title: "Reduto da Gafieira - Bday Ariel Muniz", photos: ["https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/633230552_1493292882800355_8249565377461483962_n.jpg", "https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/633135483_1493292912800352_3986319226620372975_n.jpg"] },
  { id: "e274454f-4b54-45c1-8082-be46f7184211", title: "A HIstoria de quem dança - Marcelo Amorim", photos: ["https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/622774369_1477105334419110_8685497801826703868_n.jpg", "https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/622762856_1477105191085791_3295130561522714913_n.jpg"] },
  { id: "e8e865f4-7412-4f1b-aaad-0b1ad54dd1d8", title: "Aniversario R2", photos: ["https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/589646039_1425552496241061_4751023421720997985_n.jpg", "https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/589547620_1425552629574381_5271922209993018609_n.jpg"] },
  { id: "da8845ad-04a3-46ca-be17-e4f1bb18a273", title: "Baile do Altobelli 2", photos: ["https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/557992177_1379002714229373_417547047728986978_n.jpg", "https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/560041250_1379002620896049_9159603230949624902_n.jpg"] },
  { id: "b8fe7bf5-2738-4504-abb2-15a5dda70ff9", title: "LambaSwag Domingo", photos: ["https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/553754562_1367211015408543_919815337581491513_n.jpg", "https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/555111224_1367210995408545_8640080508347909057_n.jpg"] },
  { id: "6ad36cce-8260-449e-b873-59c41fa2f1c3", title: "LambaSwag", photos: ["https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/540598758_1345761817553463_7372628731442920752_n.jpg", "https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/542016406_1345761904220121_2158494256649764701_n.jpg"] },
  { id: "a679e041-59c9-4d74-b9d2-1a5bf57bc313", title: "Congresso Gerações", photos: ["https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/524703878_1312508034212175_1103267762041026692_n.jpg", "https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/524116041_1312508047545507_8692992423129880565_n.jpg"] },
  { id: "3d002919-f2c3-4f8b-8cd3-59950f14deb7", title: "Samba ao Quadrado", photos: ["https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/495342940_1241893057940340_6004905221327199222_n.jpg", "https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/495862859_1241890977940548_8213593166215749671_n.jpg"] },
  { id: "5e5816dc-cbed-4d1f-81ae-953c35a99f95", title: "Academia Olimpo - Ultimo Baile", photos: ["https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/492631853_1232550812207898_3164592798052015721_n.jpg", "https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/493942650_1232550652207914_2546365437620461073_n.jpg"] },
  { id: "f5860735-d6af-444a-a5b5-09e94e8d142b", title: "Q Baile - 23 de novembo", photos: ["https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/492540520_1231852038944442_5143426178236738989_n.jpg", "https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/492567681_1231852328944413_5704260795288587158_n.jpg"] },
  { id: "a6dce3a0-8019-462c-af69-ffdfb75fc506", title: "Bachata Vibe Halloween", photos: ["https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/492393575_1231318028997843_3980716816373723496_n.jpg", "https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/492499318_1231318122331167_8627540997233155816_n.jpg"] }
];

async function finalImport() {
  console.log('📸 Iniciando Importação Consolidada (Novos IDs)...');
  
  for (const item of batchData) {
    console.log(`Preenchendo: ${item.title}...`);
    
    // Cleanup any partial photos
    await supabase.from('photos').delete().eq('event_id', item.id);
    
    // Insert photos (using correct schema)
    const photosToInsert = item.photos.map(url => ({
      event_id: item.id,
      full_res_url: url,
      thumbnail_url: url
    }));
    
    const { error: photoError } = await supabase.from('photos').insert(photosToInsert);
    if (photoError) console.error(`Erro ao inserir fotos para ${item.title}:`, photoError.message);
    
    // Update cover
    await supabase.from('events').update({
      cover_url: item.photos[0]
    }).eq('id', item.id);
  }
  
  console.log('✅ Tudo Pronto! 11 álbuns recentes vinculados com sucesso.');
}

finalImport();
