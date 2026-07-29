import { NextResponse } from 'next/server';
import { signPhotoUrls, getSupabaseAdmin } from '@/utils/storage-helper';

type RawPhoto = {
  id: string;
  event_id: string;
  thumbnail_url: string | null;
  full_res_url?: string | null;
  storage_path?: string | null;
  created_at?: string | null;
};

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const offset = Math.max(0, parseInt(searchParams.get('offset') || '0'));
  const limit = Math.min(300, Math.max(1, parseInt(searchParams.get('limit') || '200')));

  const supabase = getSupabaseAdmin();

  // 🔒 Segurança: "is_paid" tinha que vir de query param mandado pelo próprio
  // navegador — ou seja, qualquer um podia chamar essa rota com
  // "is_paid=false" pra um evento pago de verdade e receber o full_res_url
  // original (sem marca d'água, em alta resolução) de graça, pulando o
  // paywall inteiro. Agora a gente busca o is_paid real do evento aqui no
  // servidor, direto do banco — o valor não pode ser forjado pelo cliente.
  const { data: eventRow } = await supabase
    .from('events')
    .select('is_paid')
    .eq('id', id)
    .single();
  const isPaid = Boolean(eventRow?.is_paid);

  const photoFields = isPaid ? 'id,event_id,thumbnail_url,storage_path,created_at' : '*';

  const { data: rawPhotos } = await supabase
    .from('photos')
    .select(photoFields)
    .eq('event_id', id)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1);

  const rawPhotosWithSignedUrls = await signPhotoUrls((rawPhotos || []) as unknown as RawPhoto[]);

  const photos = rawPhotosWithSignedUrls
    .filter((p) => Boolean(p.thumbnail_url))
    .map((p) => ({
      ...p,
      full_res_url: isPaid ? p.thumbnail_url : (p.full_res_url || p.thumbnail_url),
    }));

  return NextResponse.json({ photos });
}
