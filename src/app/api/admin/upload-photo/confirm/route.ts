import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getSupabaseAdmin } from '@/utils/storage-helper';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const supabaseUser = await createClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { eventId, fullUrl, thumbUrl, fullPath, photographerId: photographerIdInput } = await req.json();
  if (!eventId || !fullUrl || !thumbUrl) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  const role = profile?.role?.toLowerCase();

  if (!['admin', 'owner', 'photographer', 'editor'].includes(role ?? '')) {
    return NextResponse.json({ error: `Sem permissão (role: ${role ?? 'null'})` }, { status: 403 });
  }

  // Mesma checagem do /upload-photo: fotógrafo comum só confirma upload em
  // evento que ele está vinculado, e a foto fica sempre no nome de quem
  // enviou (admin/editor podem atribuir a outro fotógrafo).
  if (role === 'photographer') {
    const { data: link } = await supabase
      .from('event_photographers')
      .select('photographer_id')
      .eq('event_id', eventId)
      .eq('photographer_id', user.id)
      .maybeSingle();

    if (!link) {
      return NextResponse.json({ error: 'Você não está vinculado a este evento' }, { status: 403 });
    }
  }

  const photographerId = role === 'photographer' ? user.id : (photographerIdInput || null);

  const { error } = await supabase.from('photos').insert({
    event_id: eventId,
    full_res_url: fullUrl,
    thumbnail_url: thumbUrl,
    storage_path: fullPath,
    photographer_id: photographerId,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
