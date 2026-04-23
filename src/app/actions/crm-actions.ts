"use server";

import { createClient } from '@/utils/supabase/server';

export type ActivityType = 'SCAN' | 'FAVORITE' | 'CART' | 'PURCHASE' | 'LOGIN';

export async function trackActivity(
  customerEmail: string, 
  activityType: ActivityType, 
  eventId?: string, 
  metadata: any = {}
) {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from('crm_activities')
      .insert({
        customer_email: customerEmail,
        activity_type: activityType,
        event_id: eventId,
        metadata: metadata
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
