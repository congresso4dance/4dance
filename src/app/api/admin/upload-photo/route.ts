import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getSupabaseAdmin } from '@/utils/storage-helper';
import { PHOTO_STORAGE_BUCKET } from '@/utils/storage-constants';

export const runtime = 'nodejs';
export const maxDuration = 60;
// Aumenta limite do body para 50MB (fotos originais podem ser grandes)
export const fetchCache = 'force-no-store';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // Verify the user is authenticated and has admin/photographer/owner role
  const supabaseUser = await createClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabaseUser
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role?.toLowerCase();
  if (!['admin', 'owner', 'photographer', 'editor'].includes(role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const formData = await req.formData();
  const fullFile = formData.get('full') as File | null;
  const thumbFile = formData.get('thumb') as File | null;
  const eventId = formData.get('eventId') as string | null;
  const photographerId = formData.get('photographerId') as string | null;

  if (!fullFile || !thumbFile || !eventId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const baseName = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const fileExt = fullFile.name.split('.').pop() || 'jpg';
  const fullPath = `${eventId}/full_${baseName}.${fileExt}`;
  const thumbPath = `${eventId}/thumb_${baseName}.${fileExt}`;

  const fullBuffer = Buffer.from(await fullFile.arrayBuffer());
  const thumbBuffer = Buffer.from(await thumbFile.arrayBuffer());

  const [{ error: fullError }, { error: thumbError }] = await Promise.all([
    supabase.storage.from(PHOTO_STORAGE_BUCKET).upload(fullPath, fullBuffer, {
      contentType: fullFile.type || 'image/jpeg',
      upsert: false,
    }),
    supabase.storage.from(PHOTO_STORAGE_BUCKET).upload(thumbPath, thumbBuffer, {
      contentType: 'image/jpeg',
      upsert: false,
    }),
  ]);

  if (fullError || thumbError) {
    return NextResponse.json(
      { error: fullError?.message || thumbError?.message },
      { status: 500 }
    );
  }

  const fullUrl = supabase.storage.from(PHOTO_STORAGE_BUCKET).getPublicUrl(fullPath).data.publicUrl;
  const thumbUrl = supabase.storage.from(PHOTO_STORAGE_BUCKET).getPublicUrl(thumbPath).data.publicUrl;

  const { error: dbError } = await supabase.from('photos').insert({
    event_id: eventId,
    full_res_url: fullUrl,
    thumbnail_url: thumbUrl,
    storage_path: fullPath,
    photographer_id: photographerId || null,
  });

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, fullUrl, thumbUrl });
}
