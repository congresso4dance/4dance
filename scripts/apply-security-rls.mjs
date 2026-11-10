import { readFileSync } from 'node:fs';
import pg from 'pg';

function readEnvValue(path, name) {
  const line = readFileSync(path, 'utf8').split(/\r?\n/).find((entry) => entry.startsWith(`${name}=`));
  if (!line) throw new Error(`${name} não encontrada em ${path}`);
  return line.slice(name.length + 1).trim().replace(/^['"]|['"]$/g, '');
}

const connectionString = process.env.DATABASE_URL || readEnvValue('.env.local', 'DATABASE_URL');
const sql = readFileSync('docs/security-audit/fix-rls-policies.sql', 'utf8');
const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
  || readEnvValue('.env.local', 'NEXT_PUBLIC_SUPABASE_URL').match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
const candidates = [connectionString];
if (projectRef) {
  const direct = new URL(connectionString);
  direct.hostname = `db.${projectRef}.supabase.co`;
  direct.port = '5432';
  direct.username = 'postgres';
  candidates.push(direct.toString());
}

let client;
let lastConnectionError;
for (const candidate of candidates) {
  const attempt = new pg.Client({ connectionString: candidate, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000 });
  try {
    await attempt.connect();
    client = attempt;
    break;
  } catch (error) {
    lastConnectionError = error;
    await attempt.end().catch(() => undefined);
  }
}
if (!client) throw lastConnectionError;

try {
  await client.query(sql);
  const { rows } = await client.query(`
    select tablename, policyname, cmd, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and policyname in ('Full access for authenticated admins', 'Allow admin read on leads', 'Allow admin read on alerts')
    order by tablename, policyname
  `);
  const requiredTables = new Set(['events', 'photos', 'testimonials']);
  const missingRequired = [...requiredTables].filter((table) => !rows.some((row) => row.tablename === table));
  if (missingRequired.length) throw new Error(`Policies obrigatórias ausentes: ${missingRequired.join(', ')}`);
  const unsafe = rows.filter((row) => `${row.qual} ${row.with_check}`.includes("auth.role() = 'authenticated'"));
  if (unsafe.length) throw new Error(`Policies inseguras persistem: ${unsafe.map((row) => row.tablename).join(', ')}`);
  console.log(JSON.stringify(rows.map(({ tablename, policyname, cmd }) => ({ tablename, policyname, cmd })), null, 2));
} finally {
  await client.end().catch(() => undefined);
}
