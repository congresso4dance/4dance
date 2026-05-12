import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getSupabaseAdmin } from '@/utils/storage-helper';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const supabaseUser = await createClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { eventId, fullUrl, thumbUrl, fullPath, photographerId } = await req.json();
  if (!eventId || !fullUrl || !thumbUrl) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('photos').insert({
    event_id: eventId,
    full_res_url: fullUrl,
    thumbnail_url: thumbUrl,
    storage_path: fullPath,
    photographer_id: photographerId || null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
