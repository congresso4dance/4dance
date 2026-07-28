import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getSupabaseAdmin } from '@/utils/storage-helper';
import { PHOTO_STORAGE_BUCKET, LEGACY_PHOTO_STORAGE_BUCKET } from '@/utils/storage-constants';
import { uploadToR2, toR2Ref, parseR2Ref } from '@/utils/r2-storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Migra fotos já existentes no Supabase Storage para o Cloudflare R2, evento
 * por evento, em pequenos lotes (pra caber no tempo de execução da function
 * e não estourar egress do Supabase de uma vez só).
 *
 * POST body: { eventIds: string[], limit?: number }
 * Retorna: { processed, migrated, errors, remaining }
 */
export async function POST(req: Request) {
  const supabaseUser = await createClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const supabaseAdmin = getSupabaseAdmin();
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role?.toLowerCase();
  if (!['admin', 'owner'].includes(role ?? '')) {
    return NextResponse.json({ error: `Sem permissão (role: ${role ?? 'null'})` }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const eventIds: string[] = Array.isArray(body.eventIds) ? body.eventIds : [];
  const limit = Math.min(50, Math.max(1, Number(body.limit) || 40));

  if (eventIds.length === 0) {
    return NextResponse.json({ error: 'eventIds é obrigatório' }, { status: 400 });
  }

  // Busca um lote de fotos ainda não migradas (full_res_url continua apontando
  // pro Supabase Storage, não começa com "r2://").
  const { data: photos, error: fetchError } = await supabaseAdmin
    .from('photos')
    .select('id, event_id, storage_path, full_res_url, thumbnail_url')
    .in('event_id', eventIds)
    .not('full_res_url', 'like', 'r2://%')
    .limit(limit);

  if (fetchError) {
    return NextResponse.json({ error: `DB: ${fetchError.message}` }, { status: 500 });
  }

  if (!photos || photos.length === 0) {
    return NextResponse.json({ processed: 0, migrated: 0, errors: 0, remaining: 0, done: true });
  }

  const photoBatch = photos;

  let migrated = 0;
  let errors = 0;
  const errorDetails: string[] = [];

  // Processa em paralelo (pool de workers) em vez de uma foto por vez — cada
  // foto envolve vários round-trips de rede (download Supabase x2, upload R2
  // x2, update DB), então rodar várias ao mesmo tempo usa muito melhor os 60s
  // de execução da function na Vercel.
  const CONCURRENCY = 8;
  let nextIndex = 0;

  async function migrateOne(photo: (typeof photoBatch)[number]) {
    if (parseR2Ref(photo.full_res_url)) { return; } // já migrada, segurança extra

    const fullKey: string = photo.storage_path;
    const thumbKey: string = fullKey.replace(/\/full_/, '/thumb_');

    const fullBuffer = await downloadFromSupabase(supabaseAdmin, fullKey);
    await uploadToR2(fullKey, fullBuffer, 'image/jpeg');

    // Nem toda foto antiga tem um thumb_ separado de verdade (algumas usam o
    // próprio full_res_url como thumbnail_url). Se não achar um thumb_ com
    // esse nome, usa o mesmo arquivo full como thumbnail no R2 também —
    // ainda assim já sai da cota do Supabase, e pode ser reprocessado depois.
    let thumbBuffer: Buffer;
    try {
      thumbBuffer = await downloadFromSupabase(supabaseAdmin, thumbKey);
    } catch {
      thumbBuffer = fullBuffer;
    }
    await uploadToR2(thumbKey, thumbBuffer, 'image/jpeg');

    const { error: updateError } = await supabaseAdmin
      .from('photos')
      .update({
        full_res_url: toR2Ref(fullKey),
        thumbnail_url: toR2Ref(thumbKey),
      })
      .eq('id', photo.id);

    if (updateError) throw new Error(`DB update: ${updateError.message}`);
  }

  async function worker() {
    while (nextIndex < photoBatch.length) {
      const photo = photoBatch[nextIndex++];
      try {
        await migrateOne(photo);
        migrated++;
      } catch (err: any) {
        errors++;
        errorDetails.push(`${photo.id}: ${err.message}`);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, photoBatch.length) }, worker));

  const { count: remaining } = await supabaseAdmin
    .from('photos')
    .select('id', { count: 'exact', head: true })
    .in('event_id', eventIds)
    .not('full_res_url', 'like', 'r2://%');

  return NextResponse.json({
    processed: photoBatch.length,
    migrated,
    errors,
    errorDetails: errorDetails.slice(0, 5),
    remaining: remaining ?? 0,
    done: (remaining ?? 0) === 0,
  });
}

async function downloadFromSupabase(supabaseAdmin: ReturnType<typeof getSupabaseAdmin>, path: string): Promise<Buffer> {
  const buckets = [PHOTO_STORAGE_BUCKET, LEGACY_PHOTO_STORAGE_BUCKET];
  let lastError: unknown = null;

  for (const bucket of buckets) {
    const { data, error } = await supabaseAdmin.storage.from(bucket).download(path);
    if (!error && data) {
      const arrayBuffer = await data.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
    lastError = error;
  }

  throw new Error(`Não encontrado em nenhum bucket: ${path} (${(lastError as any)?.message || 'unknown'})`);
}
