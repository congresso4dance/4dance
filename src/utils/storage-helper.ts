import { createClient } from '@supabase/supabase-js';
import { parseR2Ref, getR2SignedUrl } from './r2-storage';

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

  // 1. Fotos já migradas para o Cloudflare R2 (referência "r2://<key>" salva no banco).
  const r2SignedMap: Record<string, string> = {};
  const r2Jobs: Array<{ id: string; field: 'thumbnail_url' | 'full_res_url'; key: string }> = [];

  photos.forEach(p => {
    const thumbKey = parseR2Ref(p.thumbnail_url);
    if (thumbKey) r2Jobs.push({ id: p.id, field: 'thumbnail_url', key: thumbKey });

    const fullKey = parseR2Ref(p.full_res_url);
    if (fullKey) r2Jobs.push({ id: p.id, field: 'full_res_url', key: fullKey });
  });

  if (r2Jobs.length > 0) {
    await Promise.all(r2Jobs.map(async (job) => {
      try {
        r2SignedMap[`${job.id}-${job.field}`] = await getR2SignedUrl(job.key, expiresIn);
      } catch (err) {
        console.error(`Error signing R2 URL for key ${job.key}:`, err);
      }
    }));
  }

  // 2. Fotos antigas ainda no Supabase Storage (compatibilidade durante a migração).
  const supabase = getSupabaseAdmin();
  const photosToSign: Array<{ id: string; field: 'thumbnail_url' | 'full_res_url'; bucket: string; path: string }> = [];

  photos.forEach(p => {
    if (parseR2Ref(p.thumbnail_url)) return; // já tratado acima
    const thumbInfo = extractStorageInfo(p.thumbnail_url);
    // Se o bucket for 'photos', ele é público, não precisa assinar
    if (thumbInfo && thumbInfo.bucket !== 'photos') {
      photosToSign.push({ id: p.id, field: 'thumbnail_url', ...thumbInfo });
    }

    if (parseR2Ref(p.full_res_url)) return; // já tratado acima
    const fullInfo = extractStorageInfo(p.full_res_url);
    if (fullInfo && fullInfo.bucket !== 'photos') {
      photosToSign.push({ id: p.id, field: 'full_res_url', ...fullInfo });
    }
  });

  if (photosToSign.length === 0) {
    if (Object.keys(r2SignedMap).length === 0) return photos;
    return photos.map(p => ({
      ...p,
      thumbnail_url: r2SignedMap[`${p.id}-thumbnail_url`] || p.thumbnail_url,
      full_res_url: r2SignedMap[`${p.id}-full_res_url`] || p.full_res_url,
    }));
  }

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
    // Pegar caminhos únicos para evitar que o Supabase retorne menos URLs que o esperado
    const uniquePaths = Array.from(new Set(items.map(i => i.path)));
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrls(uniquePaths, expiresIn);

    if (!error && data) {
      // Criar mapa temporário de path -> signedUrl
      const pathMap: Record<string, string> = {};
      data.forEach(d => {
        if (d.signedUrl) {
          // Extrair o path original da URL assinada ou usar a ordem
          // Como createSignedUrls mantém a ordem dos uniquePaths:
          pathMap[d.path || ''] = d.signedUrl;
        }
      });

      // Se d.path não vier, precisamos de um fallback mais seguro. 
      // Supabase costuma retornar na mesma ordem.
      items.forEach(item => {
        const signedInfo = data.find(d => d.path === item.path);
        if (signedInfo?.signedUrl) {
          signedMap[`${item.id}-${item.field}`] = signedInfo.signedUrl;
        }
      });
    } else if (error) {
      console.error(`Error signing URLs for bucket ${bucket}:`, error);
    }
  }

  // Return updated photos (mesclando URLs assinadas do R2 e do Supabase Storage legado)
  return photos.map(p => ({
    ...p,
    thumbnail_url: r2SignedMap[`${p.id}-thumbnail_url`] || signedMap[`${p.id}-thumbnail_url`] || p.thumbnail_url,
    full_res_url: r2SignedMap[`${p.id}-full_res_url`] || signedMap[`${p.id}-full_res_url`] || p.full_res_url
  }));
}

/**
 * Sign a single URL (e.g. for cover_url)
 * Robustly handles full Supabase URLs or raw storage paths.
 */
export async function signSingleUrl(input: string | null | undefined, expiresIn = 21600): Promise<string | null> {
  if (!input) return null;

  const r2Key = parseR2Ref(input);
  if (r2Key) {
    try {
      return await getR2SignedUrl(r2Key, expiresIn);
    } catch (err) {
      console.error('Error signing R2 URL:', err);
      return input;
    }
  }

  const info = extractStorageInfo(input);
  const supabase = getSupabaseAdmin();

  // If it's a full Supabase URL, sign it
  if (info) {
    if (info.bucket === 'photos') return input; // Já é público
    
    const { data, error } = await supabase.storage
      .from(info.bucket)
      .createSignedUrl(info.path, expiresIn);

    if (!error && data) return data.signedUrl;
    console.error('Error signing Supabase URL:', error);
    return input;
  }

  // If it's not a URL, maybe it's a raw path. Try signing it in default buckets.
  // We try 'photos' first, then 'event-photos'
  const buckets = ['photos', 'event-photos'];
  for (const bucket of buckets) {
    const { data } = await supabase.storage
      .from(bucket)
      .createSignedUrl(input, expiresIn);
    
    if (data?.signedUrl) return data.signedUrl;
  }

  return input; // Return as is (might be external URL like FB/Google)
}
