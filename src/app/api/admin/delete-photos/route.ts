import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getSupabaseAdmin } from '@/utils/storage-helper';
import { PHOTO_STORAGE_BUCKET } from '@/utils/storage-constants';
import { deleteFromR2 } from '@/utils/r2-storage';

export async function POST(req: Request) {
  const supabaseUser = await createClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  const role = profile?.role?.toLowerCase();
  if (!['admin', 'owner', 'photographer', 'editor'].includes(role ?? '')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body: unknown = await req.json().catch(() => null);
  const photoIds = typeof body === 'object' && body !== null && 'photoIds' in body && Array.isArray(body.photoIds)
    ? body.photoIds.filter((id): id is string => typeof id === 'string').slice(0, 500)
    : [];
  if (photoIds.length === 0) return NextResponse.json({ error: 'Missing photoIds' }, { status: 400 });

  const { data: photos, error: photoError } = await admin.from('photos').select('id,event_id,storage_path').in('id', photoIds);
  if (photoError || !photos || photos.length !== new Set(photoIds).size) return NextResponse.json({ error: 'Foto não encontrada' }, { status: 404 });

  if (role === 'photographer') {
    const eventIds = [...new Set(photos.map((photo) => photo.event_id))];
    const { data: links } = await admin.from('event_photographers').select('event_id').eq('photographer_id', user.id).in('event_id', eventIds);
    const allowed = new Set((links ?? []).map((link) => link.event_id));
    if (eventIds.some((eventId) => !allowed.has(eventId))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const paths = photos.map((photo) => photo.storage_path).filter((path): path is string => Boolean(path));
  const storageResults = await Promise.allSettled([
    deleteFromR2(paths),
    admin.storage.from(PHOTO_STORAGE_BUCKET).remove(paths).then(({ error }) => { if (error) throw error; }),
  ]);
  if (storageResults.every((result) => result.status === 'rejected')) return NextResponse.json({ error: 'Falha ao remover arquivos' }, { status: 500 });
  const { error: deleteError } = await admin.from('photos').delete().in('id', photoIds);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
  return NextResponse.json({ ok: true, deleted: photoIds.length });
}
