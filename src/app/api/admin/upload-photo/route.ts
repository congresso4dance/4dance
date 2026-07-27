import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { createClient } from '@/utils/supabase/server';
import { getSupabaseAdmin } from '@/utils/storage-helper';
import { uploadToR2, toR2Ref } from '@/utils/r2-storage';
import { logAdminAction } from '@/utils/audit';

// Dimensões/qualidade da imagem "cheia" servida no lightbox/download e da
// miniatura usada na grade da galeria. Antes, o "thumb" era literalmente o
// mesmo arquivo do "full" (às vezes até o arquivo original sem compressão),
// o que fazia toda a galeria carregar full-res só pra mostrar uma miniatura
// pequena — dobrando o storage e explodindo o egress no Supabase.
const FULL_MAX_DIMENSION = 2400;
const FULL_QUALITY = 85;
const THUMB_MAX_DIMENSION = 640;
const THUMB_QUALITY = 72;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // Verificar autenticação via cookie de sessão
  const supabaseUser = await createClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  // Usar service role para ler perfil (evita bloqueio de RLS em user_profiles)
  const supabaseAdmin = getSupabaseAdmin();
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role?.toLowerCase();
  if (!['admin', 'owner', 'photographer', 'editor'].includes(role ?? '')) {
    return NextResponse.json({ error: `Sem permissão (role: ${role ?? 'null'})` }, { status: 403 });
  }

  const formData = await req.formData();
  const fullFile = formData.get('full') as File | null;
  const eventId = formData.get('eventId') as string | null;
  const photographerId = formData.get('photographerId') as string | null;
  // O campo 'thumb' ainda pode chegar de clientes antigos, mas é ignorado:
  // o thumbnail de verdade agora é sempre gerado aqui no servidor a partir
  // do 'full', então nunca fica igual (ou maior) que a imagem cheia.

  if (!fullFile || !eventId) {
    return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 });
  }

  const supabase = supabaseAdmin;
  const baseName = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const fullPath = `${eventId}/full_${baseName}.jpg`;
  const thumbPath = `${eventId}/thumb_${baseName}.jpg`;

  const originalBuffer = Buffer.from(await fullFile.arrayBuffer());

  let fullBuffer: Buffer;
  let thumbBuffer: Buffer;
  try {
    const image = sharp(originalBuffer).rotate(); // aplica orientação EXIF e depois descarta metadata

    fullBuffer = await image
      .clone()
      .resize({ width: FULL_MAX_DIMENSION, height: FULL_MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: FULL_QUALITY, mozjpeg: true })
      .toBuffer();

    thumbBuffer = await image
      .clone()
      .resize({ width: THUMB_MAX_DIMENSION, height: THUMB_MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: THUMB_QUALITY, mozjpeg: true })
      .toBuffer();
  } catch (imgError: any) {
    return NextResponse.json({ error: `Falha ao processar imagem: ${imgError.message}` }, { status: 400 });
  }

  try {
    await uploadToR2(fullPath, fullBuffer, 'image/jpeg');
    await uploadToR2(thumbPath, thumbBuffer, 'image/jpeg');
  } catch (r2Error: any) {
    return NextResponse.json({ error: `Storage (R2): ${r2Error.message}` }, { status: 500 });
  }

  const { error: dbError } = await supabase.from('photos').insert({
    event_id: eventId,
    full_res_url: toR2Ref(fullPath),
    thumbnail_url: toR2Ref(thumbPath),
    storage_path: fullPath,
    photographer_id: photographerId || null,
  });

  if (dbError) {
    return NextResponse.json({ error: `DB: ${dbError.message}` }, { status: 500 });
  }

  // 📝 Gravar log de auditoria
  await logAdminAction('UPLOAD_PHOTO', {
    eventId,
    fileName: fullFile.name,
    storagePath: fullPath
  });

  return NextResponse.json({ ok: true });
}
