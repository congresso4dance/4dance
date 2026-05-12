import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getSupabaseAdmin } from '@/utils/storage-helper';
import { PHOTO_STORAGE_BUCKET } from '@/utils/storage-constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/admin/upload-photo
// Body JSON: { eventId, photographerId?, fullExt, thumbExt }
// Returns: { fullUploadUrl, thumbUploadUrl, fullPath, thumbPath }
// After uploading directly to storage, call POST /api/admin/upload-photo/confirm
export async function POST(req: Request) {
  const supabaseUser = await createClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabaseUser
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role?.toLowerCase();
  if (!['admin', 'owner', 'photographer', 'editor'].includes(role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json() as {
    eventId: string;
    photographerId?: string;
    fullExt: string;
    thumbExt: string;
  };

  const { eventId, photographerId, fullExt = 'jpg', thumbExt = 'jpg' } = body;
  if (!eventId) return NextResponse.json({ error: 'Missing eventId' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const baseName = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const fullPath = `${eventId}/full_${baseName}.${fullExt}`;
  const thumbPath = `${eventId}/thumb_${baseName}.${thumbExt}`;

  const [{ data: fullSign, error: e1 }, { data: thumbSign, error: e2 }] = await Promise.all([
    supabase.storage.from(PHOTO_STORAGE_BUCKET).createSignedUploadUrl(fullPath),
    supabase.storage.from(PHOTO_STORAGE_BUCKET).createSignedUploadUrl(thumbPath),
  ]);

  if (e1 || e2 || !fullSign || !thumbSign) {
    return NextResponse.json({ error: e1?.message || e2?.message || 'Failed to create signed URLs' }, { status: 500 });
  }

  // Save pending record so confirm can find it
  const fullUrl = supabase.storage.from(PHOTO_STORAGE_BUCKET).getPublicUrl(fullPath).data.publicUrl;
  const thumbUrl = supabase.storage.from(PHOTO_STORAGE_BUCKET).getPublicUrl(thumbPath).data.publicUrl;

  return NextResponse.json({
    fullUploadUrl: fullSign.signedUrl,
    thumbUploadUrl: thumbSign.signedUrl,
    fullPath,
    thumbPath,
    fullUrl,
    thumbUrl,
    eventId,
    photographerId: photographerId || null,
  });
}
