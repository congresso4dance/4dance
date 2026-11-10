"use server";

import { createClient } from '@/utils/supabase/server';
import type { ActivityType } from '@/utils/crm-internal';

export async function trackActivity(customerEmail: string, activityType: ActivityType, eventId?: string, metadata: Record<string, unknown> = {}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email?.toLowerCase() !== customerEmail.trim().toLowerCase()) return { success: false, error: 'Não autorizado' };
  try {
    const { error } = await supabase.from('crm_activities').insert({ customer_email: user.email, activity_type: activityType, event_id: eventId, metadata: { ...metadata, client_side: true }, user_id: user.id });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro interno' };
  }
}
