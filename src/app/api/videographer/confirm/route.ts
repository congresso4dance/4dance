import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getSupabaseAdmin } from '@/utils/storage-helper';
import { headR2Object } from '@/utils/r2-storage';
import { logAdminAction } from '@/utils/audit';

// Confirma que o upload direto pro R2 (via URL pré-assinada) terminou e
// grava o registro do vídeo no banco.
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
  if (!['admin', 'owner', 'photographer', 'editor'].includes(role ?? '')) {
    return NextResponse.json({ error: `Sem permissão (role: ${role ?? 'null'})` }, { status: 403 });
  }

  const { eventId, key, title, photographerId: photographerIdInput } = await req.json();
  if (!eventId || !key) {
    return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 });
  }

  if (role === 'photographer') {
    const { data: link } = await supabaseAdmin
      .from('event_photographers')
      .select('photographer_id')
      .eq('event_id', eventId)
      .eq('photographer_id', user.id)
      .maybeSingle();

    if (!link) {
      return NextResponse.json({ error: 'Você não está vinculado a este evento' }, { status: 403 });
    }
  }

  // Confirma que o objeto realmente existe no R2 antes de gravar no banco
  // (evita registro "fantasma" se o PUT direto falhou silenciosamente).
  const meta = await headR2Object(key);
  if (!meta) {
    return NextResponse.json({ error: 'Upload não encontrado no storage. Tente novamente.' }, { status: 400 });
  }

  const photographerId = role === 'photographer' ? user.id : (photographerIdInput || null);

  const { data: video, error: dbError } = await supabaseAdmin
    .from('videos')
    .insert({
      event_id: eventId,
      photographer_id: photographerId || null,
      storage_path: key,
      title: title || null,
    })
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: `DB: ${dbError.message}` }, { status: 500 });
  }

  await logAdminAction('UPLOAD_VIDEO', { eventId, storagePath: key });

  return NextResponse.json({ ok: true, video });
}
