import { NextResponse } from 'next/server';
import { downloadFromR2, toR2Ref } from '@/utils/r2-storage';
import { getSupabaseAdmin } from '@/utils/storage-helper';
import { createClient } from '@/utils/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get('key');
  if (!key || key.includes('..') || key.startsWith('/')) return NextResponse.json({ error: 'key inválida' }, { status: 400 });
  const admin = getSupabaseAdmin();
  const ref = toR2Ref(key);
  const { data: photo } = await admin.from('photos').select('id,event_id,thumbnail_url,full_res_url,events(is_paid)').or(`thumbnail_url.eq.${ref},full_res_url.eq.${ref}`).maybeSingle();
  if (!photo) return NextResponse.json({ error: 'Foto não encontrada' }, { status: 404 });

  const event = photo.events as unknown as { is_paid?: boolean } | null;
  let authorized = photo.thumbnail_url === ref || event?.is_paid === false;
  if (!authorized) {
    const supabaseUser = await createClient();
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (user) {
      const [{ data: profile }, { data: order }, { data: link }] = await Promise.all([
        admin.from('profiles').select('role').eq('id', user.id).maybeSingle(),
        admin.from('orders').select('id').eq('user_id', user.id).eq('status', 'paid').contains('items', [photo.id]).limit(1).maybeSingle(),
        admin.from('event_photographers').select('event_id').eq('event_id', photo.event_id).eq('photographer_id', user.id).maybeSingle(),
      ]);
      authorized = ['owner', 'admin', 'editor'].includes(profile?.role?.toLowerCase() ?? '') || Boolean(order) || Boolean(link);
    }
  }
  if (!authorized) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const { buffer, contentType } = await downloadFromR2(key);
    return new NextResponse(new Uint8Array(buffer), { headers: { 'Content-Type': contentType || 'image/jpeg', 'Cache-Control': photo.thumbnail_url === ref ? 'public, max-age=86400' : 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
  } catch {
    return NextResponse.json({ error: 'Foto não encontrada' }, { status: 404 });
  }
}
