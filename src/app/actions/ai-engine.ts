"use server";

import { createClient } from '@supabase/supabase-js';

// Usamos o Service Role para garantir que o Robô tenha acesso total, ignorando RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Busca um lote de fotos pendentes de indexação
 */
export async function getPendingPhotos(limit = 20) {
  try {
    const { data, error } = await supabaseAdmin
      .from('photos')
      .select('id, full_res_url, event_id')
      .eq('is_indexed', false)
      .limit(limit);
      
    if (error) {
      console.error("Supabase Error in getPendingPhotos:", error);
      throw new Error(`DB Error: ${error.message}`);
    }
    return data;
  } catch (err: any) {
    console.error("Critical Error in getPendingPhotos:", err);
    throw new Error(err.message || "Unknown Connection Error");
  }
}

/**
 * Salva as faces encontradas e marca a foto como indexada
 */
export async function markPhotoAsIndexed(photoId: string, faces: any[]) {
  if (faces.length > 0) {
    const { error: insertError } = await supabaseAdmin
      .from('photo_faces')
      .insert(faces.map(f => ({
        photo_id: photoId,
        embedding: f.embedding
      })));
      
    if (insertError) throw insertError;
  }
  
  const { error: updateError } = await supabaseAdmin
    .from('photos')
    .update({ is_indexed: true })
    .eq('id', photoId);
    
  if (updateError) throw updateError;
  
  return { success: true };
}

/**
 * Reset Global (Apenas para emergências/re-indexação)
 */
export async function resetAllIndexing() {
  const { error } = await supabaseAdmin
    .from('photos')
    .update({ is_indexed: false });
    
  if (error) throw error;
  return { success: true };
}
