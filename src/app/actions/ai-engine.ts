"use server";

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/server';

/**
 * 🔒 SEGURANÇA: Verifica se o usuário tem permissão administrativa
 * antes de retornar um cliente com privilégios de Service Role.
 */
async function getAdminClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Não autorizado: Sessão não encontrada.");
  }

  // Busca o perfil para verificar a Role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const allowedRoles = ['owner', 'admin'];
  if (!allowedRoles.includes(profile?.role || '')) {
    throw new Error("Não autorizado: Privilégios insuficientes.");
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Busca um lote de fotos pendentes de indexação
 */
export async function getPendingPhotos(limit = 20) {
  try {
    const supabaseAdmin = await getAdminClient();
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
  const supabaseAdmin = await getAdminClient();

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
  const supabaseAdmin = await getAdminClient();
  const { error } = await supabaseAdmin
    .from('photos')
    .update({ is_indexed: false });
    
  if (error) throw error;
  return { success: true };
}

