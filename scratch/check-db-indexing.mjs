import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing keys in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkIndexing() {
  console.log("--- Diagnóstico de Indexação ---");
  
  // 1. Verificar evento
  const eventSlug = 'reduto-da-gafieira-bday-ariel-muniz-248';
  const { data: event } = await supabase.from('events').select('id').eq('slug', eventSlug).single();
  
  if (!event) {
    console.log("Evento não encontrado:", eventSlug);
    return;
  }
  console.log("ID do Evento:", event.id);

  // 2. Contar fotos
  const { count: photoCount } = await supabase.from('photos').select('*', { count: 'exact', head: true }).eq('event_id', event.id);
  console.log("Total de fotos no evento:", photoCount);

  // 3. Contar faces indexadas
  const { data: faces, count: faceCount } = await supabase
    .from('photo_faces')
    .select('id, embedding', { count: 'exact' })
    .limit(5); // Pegar as 5 primeiras para conferir o formato

  const { count: eventFaceCount } = await supabase
    .from('photo_faces')
    .select('*', { count: 'exact', head: true })
    .filter('photo_id', 'in', `(select id from photos where event_id = '${event.id}')`);
    
  // Nota: o filtro 'in' com subquery no JS do supabase é chatinho. 
  // Vamos fazer uma query mais bruta pra garantir.
  const { data: allEventPhotos } = await supabase.from('photos').select('id').eq('event_id', event.id);
  const photoIds = allEventPhotos.map(p => p.id);
  
  const { count: actualFaceCount } = await supabase
    .from('photo_faces')
    .select('*', { count: 'exact', head: true })
    .in('photo_id', photoIds);

  console.log("Faces indexadas para este evento:", actualFaceCount);

  if (faces && faces.length > 0) {
    console.log("Exemplo de embedding (primeiros 5 valores):", 
      faces[0].embedding.substring(0, 50) + "..."
    );
  } else {
    console.log("NENHUMA FACE ENCONTRADA NA TABELA PHOTO_FACES.");
  }
}

checkIndexing();
