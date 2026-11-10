import 'server-only';
import { createClient } from '@/utils/supabase/server';
import { getSupabaseAdmin, signPhotoUrls } from '@/utils/storage-helper';

type SafePhoto = { id: string; event_id?: string; thumbnail_url?: string | null; full_res_url?: string | null; [key: string]: unknown };

export async function securelyLoadAndSignPhotos(ids: string[]): Promise<SafePhoto[]> {
  const uniqueIds = [...new Set(ids.filter(Boolean))].slice(0, 500);
  if (uniqueIds.length === 0) return [];
  const admin = getSupabaseAdmin();
  const userClient = await createClient();
  const { data: { user } } = await userClient.auth.getUser();
  const { data: photos } = await admin.from('photos').select('*,events(is_paid)').in('id', uniqueIds);
  if (!photos) return [];

  let privileged = false;
  const purchased = new Set<string>();
  const linkedEvents = new Set<string>();
  if (user) {
    const [{ data: profile }, { data: orders }, { data: links }] = await Promise.all([
      admin.from('profiles').select('role').eq('id', user.id).maybeSingle(),
      admin.from('orders').select('items').eq('user_id', user.id).eq('status', 'paid'),
      admin.from('event_photographers').select('event_id').eq('photographer_id', user.id),
    ]);
    privileged = ['owner', 'admin', 'editor'].includes(profile?.role?.toLowerCase() ?? '');
    for (const order of orders ?? []) for (const id of (order.items as string[] | null) ?? []) purchased.add(id);
    for (const link of links ?? []) linkedEvents.add(link.event_id);
  }

  const filtered = photos.map((photo) => {
    const event = photo.events as { is_paid?: boolean } | null;
    const canAccessFull = event?.is_paid === false || privileged || purchased.has(photo.id) || linkedEvents.has(photo.event_id);
    const { events: _events, ...safe } = photo;
    return { ...safe, full_res_url: canAccessFull ? photo.full_res_url : null };
  });
  return signPhotoUrls(filtered);
}
