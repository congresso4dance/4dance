import { createClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase Admin client with service_role privileges.
 * This client can bypass RLS and generate signed URLs.
 */
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Supabase Admin environment variables are missing');
  }

  return createClient(url, key);
}

/**
 * Extracts bucket and path from a Supabase public URL.
 * Format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
 */
export function extractStorageInfo(publicUrl: string | null | undefined) {
  if (!publicUrl) return null;
  
  const match = publicUrl.match(/\/public\/([^/]+)\/(.+)$/);
  if (!match) return null;
  
  return {
    bucket: match[1],
    path: decodeURIComponent(match[2])
  };
}

/**
 * Generates signed URLs for a list of photos, updating their URL fields.
 * Handles both thumbnail_url and full_res_url.
 */
export async function signPhotoUrls<T extends { id: string; thumbnail_url?: string | null; full_res_url?: string | null }>(
  photos: T[],
  expiresIn = 21600
): Promise<T[]> {
  if (!photos || photos.length === 0) return photos;

  const supabase = getSupabaseAdmin();
  const photosToSign: Array<{ id: string; field: 'thumbnail_url' | 'full_res_url'; bucket: string; path: string }> = [];

  // Identify all URLs that need signing
  photos.forEach(p => {
    const thumbInfo = extractStorageInfo(p.thumbnail_url);
    if (thumbInfo) {
      photosToSign.push({ id: p.id, field: 'thumbnail_url', ...thumbInfo });
    }

    const fullInfo = extractStorageInfo(p.full_res_url);
    if (fullInfo) {
      photosToSign.push({ id: p.id, field: 'full_res_url', ...fullInfo });
    }
  });

  if (photosToSign.length === 0) return photos;

  // Group by bucket
  const byBucket: Record<string, typeof photosToSign> = {};
  photosToSign.forEach(item => {
    if (!byBucket[item.bucket]) byBucket[item.bucket] = [];
    byBucket[item.bucket].push(item);
  });

  // Create a map of [id-field] -> signedUrl
  const signedMap: Record<string, string> = {};

  for (const bucket in byBucket) {
    const items = byBucket[bucket];
    const paths = items.map(i => i.path);

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrls(paths, expiresIn);

    if (!error && data) {
      data.forEach((signedItem, index) => {
        if (signedItem.signedUrl) {
          const originalItem = items[index];
          signedMap[`${originalItem.id}-${originalItem.field}`] = signedItem.signedUrl;
        }
      });
    } else if (error) {
      console.error(`Error signing URLs for bucket ${bucket}:`, error);
    }
  }

  // Return updated photos
  return photos.map(p => ({
    ...p,
    thumbnail_url: signedMap[`${p.id}-thumbnail_url`] || p.thumbnail_url,
    full_res_url: signedMap[`${p.id}-full_res_url`] || p.full_res_url
  }));
}

/**
 * Sign a single URL (e.g. for cover_url)
 */
export async function signSingleUrl(publicUrl: string | null | undefined, expiresIn = 21600): Promise<string | null> {
  if (!publicUrl) return null;
  
  const info = extractStorageInfo(publicUrl);
  if (!info) return publicUrl; // Not a storage URL or already signed/external

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from(info.bucket)
    .createSignedUrl(info.path, expiresIn);

  if (error || !data) {
    console.error('Error signing single URL:', error);
    return publicUrl;
  }

  return data.signedUrl;
}
