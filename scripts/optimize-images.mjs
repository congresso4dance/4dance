import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import dotenv from 'dotenv';
import { Buffer } from 'buffer';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Chaves do Supabase não encontradas no .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const BUCKET_NAME = 'photos';
const START_PATH = 'events'; // Suas fotos estão aqui

async function listAllFiles(path) {
  let allFiles = [];
  const { data: items, error } = await supabase.storage.from(BUCKET_NAME).list(path, { limit: 1000 });
  
  if (error) {
    console.error(`❌ Erro ao listar ${path}:`, error.message);
    return [];
  }

  for (const item of items) {
    const fullPath = path ? `${path}/${item.name}` : item.name;
    if (item.id === null) {
      // É uma pasta, buscar recursivamente
      const subFiles = await listAllFiles(fullPath);
      allFiles = allFiles.concat(subFiles);
    } else {
      // É um arquivo
      allFiles.push({ ...item, name: fullPath });
    }
  }
  return allFiles;
}

async function optimizeImages() {
  console.log('🔥 MODO TURBO ATIVADO: Iniciando otimização em massa...');

  const files = await listAllFiles(START_PATH);
  console.log(`📸 Total de arquivos para analisar: ${files.length}`);

  let totalSaved = 0;
  let processedCount = 0;
  let skippedCount = 0;
  const CONCURRENCY = 20; // Aumentado para CARGA TOTAL (20 fotos simultâneas)

  // Função para processar uma única imagem
  const processFile = async (file) => {
    const size = file.metadata?.size || 0;
    if (file.id === undefined || size < 500 * 1024 || file.name.endsWith('.webp')) {
      skippedCount++;
      return;
    }

    try {
      const { data: blob, error: downloadError } = await supabase.storage.from(BUCKET_NAME).download(file.name);
      if (downloadError) return;

      const buffer = Buffer.from(await blob.arrayBuffer());
      const optimizedBuffer = await sharp(buffer)
        .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 75 }) // Reduzimos um pouco mais a qualidade para ganhar mais espaço
        .toBuffer();

      const newSize = optimizedBuffer.length;
      const saved = size - newSize;
      
      const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(file.name, optimizedBuffer, {
        contentType: 'image/webp',
        upsert: true
      });

      if (!uploadError) {
        totalSaved += saved;
        processedCount++;
        if (processedCount % 5 === 0) {
          console.log(`\n📊 [STATUS PARCIAL]`);
          console.log(`✅ Processadas: ${processedCount} | ⏩ Puladas: ${skippedCount}`);
          console.log(`💰 Economia Total: ${(totalSaved / 1024 / 1024).toFixed(2)} MB`);
          console.log(`🖼️ Última: ${file.name.split('/').pop()}`);
          console.log(`-----------------------------------`);
        }
      }
    } catch {
      // Silencioso para não poluir o terminal no modo turbo
    }
  };

  // Executar em lotes paralelos
  for (let i = 0; i < files.length; i += CONCURRENCY) {
    const batch = files.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(file => processFile(file)));
  }

  console.log('\n--- ✨ MISSÃO CUMPRIDA ---');
  console.log(`📊 Total Final de Fotos Otimizadas: ${processedCount}`);
  console.log(`💰 Espaço Total Recuperado: ${(totalSaved / 1024 / 1024).toFixed(2)} MB`);
}

optimizeImages();
