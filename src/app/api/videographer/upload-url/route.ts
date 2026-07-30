import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getSupabaseAdmin } from '@/utils/storage-helper';
import { getR2UploadUrl } from '@/utils/r2-storage';

// Gera uma URL pré-assinada de PUT pro navegador subir o vídeo DIRETO pro R2.
// Não passa pela nossa function (limite de payload do Vercel), só a
// confirmação final (rota /api/videographer/confirm) toca o banco.
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

  const { eventId, contentType } = await req.json();
  if (!eventId || !contentType) {
    return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 });
  }

  if (!contentType.startsWith('video/')) {
    return NextResponse.json({ error: 'Arquivo precisa ser um vídeo' }, { status: 400 });
  }

  // Mesma regra de vínculo evento<->fotógrafo usada no upload de fotos.
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

  const ext = contentType.split('/')[1]?.split(';')[0] || 'mp4';
  const key = `videos/${eventId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  try {
    const uploadUrl = await getR2UploadUrl(key, contentType);
    return NextResponse.json({ uploadUrl, key });
  } catch (err: any) {
    return NextResponse.json({ error: `Storage (R2): ${err.message}` }, { status: 500 });
  }
}
