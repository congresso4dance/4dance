"use server";

import { createClient } from '@/utils/supabase/server';

export type ActivityType = 'SCAN' | 'FAVORITE' | 'CART' | 'PURCHASE' | 'LOGIN';

/**
 * 🔒 SEGURANÇA: Registra atividades no CRM com validação de identidade.
 */
/**
 * 🔒 INTERNO: Registra atividades no CRM sem validação de usuário (para Webhooks/Server)
 */
export async function trackActivityInternal(
    customerEmail: string, 
    activityType: ActivityType, 
    eventId?: string, 
    metadata: any = {}
  ) {
    // Usar Service Role para garantir que o log seja gravado mesmo sem sessão (ex: Webhook)
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    return await supabase
      .from('crm_activities')
      .insert({
        customer_email: customerEmail,
        activity_type: activityType,
        event_id: eventId,
        metadata: metadata
      });
}

/**
 * 🔒 SEGURO: Registra atividades no CRM com validação de identidade (para Client-side)
 */
export async function trackActivity(
  customerEmail: string, 
  activityType: ActivityType, 
  eventId?: string, 
  metadata: any = {}
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 🔒 SEGURANÇA: Apenas usuários logados podem registrar atividade via Client
  if (!user) {
    return { success: false, error: "Não autorizado" };
  }

  try {
    const { error } = await supabase
      .from('crm_activities')
      .insert({
        customer_email: customerEmail,
        activity_type: activityType,
        event_id: eventId,
        metadata: { ...metadata, client_side: true },
        user_id: user.id 
      });

    if (error) {
      console.error("CRM Tracking Error:", error);
      return { success: false, error };
    }

    return { success: true };
  } catch (err) {
    console.error("CRM Tracking Exception:", err);
    return { success: false, error: err };
  }
}

// Helper import needed for trackActivityInternal
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
const createClient = createSupabaseClient;

