import { createClient } from '@/utils/supabase/server';
import CRMContent from './CRMContent';

export default async function CRMElitePage() {
  const supabase = await createClient();

  // 1. Fetch CRM Data (SERVER SIDE)
  const { data: leads } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
  
  const { data: orders } = await supabase
    .from('orders')
    .select(`
        *,
        profiles (full_name, email)
    `)
    .order('created_at', { ascending: false });

  const { data: activities } = await supabase
    .from('crm_activities')
    .select('*, events(title)')
    .order('created_at', { ascending: false });

  return (
    <CRMContent 
      leads={leads || []} 
      orders={orders || []} 
      activities={activities || []} 
    />
  );
}
