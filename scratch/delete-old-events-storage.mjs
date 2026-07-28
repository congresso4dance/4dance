// Apaga a pasta "events/" (fotos antigas, não migradas pro R2) do bucket
// "photos" do Supabase Storage. Rode você mesmo no seu terminal — o Claude
// não executa isso automaticamente (exclusão permanente de dados).
//
// Uso:
//   node scratch/delete-old-events-storage.mjs            -> só lista/conta, não apaga nada
//   node scratch/delete-old-events-storage.mjs --confirm   -> apaga de verdade
//
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

const BUCKET = 'photos';
const ROOT_PREFIX = 'events';
const CONFIRM = process.argv.includes('--confirm');

async function listAllFiles(prefix) {
  let all = [];
  let offset = 0;
  const limit = 1000;
  while (true) {
    const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit, offset });
    if (error) throw new Error(`Erro ao listar "${prefix}": ${error.message}`);
    if (!data || data.length === 0) break;

    for (const entry of data) {
      const fullPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.id === null) {
        // é uma "pasta" (prefixo) — desce recursivamente
        const nested = await listAllFiles(fullPath);
        all = all.concat(nested);
      } else {
        all.push(fullPath);
      }
    }

    if (data.length < limit) break;
    offset += limit;
  }
  return all;
}

console.log(`Listando arquivos em ${BUCKET}/${ROOT_PREFIX}/ (isso pode demorar um pouco, são milhares de arquivos)...`);
const files = await listAllFiles(ROOT_PREFIX);
console.log(`\nTotal encontrado: ${files.length} arquivos.\n`);

if (files.length === 0) {
  console.log('Nada para apagar — já está vazio.');
  process.exit(0);
}

if (!CONFIRM) {
  console.log('Modo consulta (sem --confirm). Exemplos de arquivos que seriam apagados:');
  console.log(files.slice(0, 10).join('\n'));
  console.log(`\n... e mais ${files.length - 10} arquivos.`);
  console.log('\nPra apagar de verdade, rode: node scratch/delete-old-events-storage.mjs --confirm');
  process.exit(0);
}

console.log('Apagando de verdade agora...\n');
const CHUNK = 1000;
let deletedCount = 0;
let errorCount = 0;

for (let i = 0; i < files.length; i += CHUNK) {
  const chunk = files.slice(i, i + CHUNK);
  const { data, error } = await supabase.storage.from(BUCKET).remove(chunk);
  if (error) {
    console.error(`Erro no lote ${i}-${i + chunk.length}: ${error.message}`);
    errorCount += chunk.length;
    continue;
  }
  deletedCount += (data ?? chunk).length;
  console.log(`Apagados ${deletedCount}/${files.length}...`);
}

console.log(`\nConcluído. Apagados: ${deletedCount}. Erros: ${errorCount}.`);
