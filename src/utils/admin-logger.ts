import { createClient } from '@/utils/supabase/client';

export type AdminAction = 
  | 'CREATE_EVENT' 
  | 'UPDATE_EVENT' 
  | 'DELETE_EVENT' 
  | 'UPLOAD_PHOTOS' 
  | 'DELETE_PHOTOS' 
  | 'UPDATE_SETTINGS' 
  | 'INDEX_FACES';

export async function logAdminAction(
  action: AdminAction,
  details: any,
  targetId?: string
) {
  const supabase = createClient();
  
  // Get current user for email
  const { data: { user } } = await supabase.auth.getUser();
  
  const { error } = await supabase
    .from('admin_logs')
    .insert({
      admin_id: user?.id,
      admin_email: user?.email,
      action,
      details,
      target_id: targetId
    });

  if (error) console.error("Failed to log admin action:", error);
}
