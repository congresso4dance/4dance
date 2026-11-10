import 'server-only';
import { createClient } from '@supabase/supabase-js';

export type ActivityType = 'SCAN' | 'FAVORITE' | 'CART' | 'PURCHASE' | 'LOGIN';

export async function trackActivityInternal(customerEmail: string, activityType: ActivityType, eventId?: string, metadata: Record<string, unknown> = {}) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  return supabase.from('crm_activities').insert({ customer_email: customerEmail, activity_type: activityType, event_id: eventId, metadata });
}
