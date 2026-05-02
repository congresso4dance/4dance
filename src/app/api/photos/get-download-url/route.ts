import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { LEGACY_PHOTO_STORAGE_BUCKET, PHOTO_STORAGE_BUCKET } from '@/utils/storage-constants';

type PhotoEvent = {
  id: string;
  is_paid: boolean | null;
};

type DownloadPhoto = {
  id: string;
  storage_path: string;
  events: PhotoEvent | null;
};

let supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  return supabaseAdmin;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const photoId = searchParams.get('photoId');

    if (!photoId) {
      return NextResponse.json({ error: 'ID da foto é obrigatório' }, { status: 400 });
    }

    const supabaseServer = await createServerClient();
    const supabaseAdmin = getSupabaseAdmin();
    const { data: { user } } = await supabaseServer.auth.getUser();

    // 1. Fetch photo and its event pricing policy
    const { data: photoData, error: photoError } = await supabaseAdmin
      .from('photos')
      .select('id, storage_path, events(id, is_paid)') // 🔒 Lei 9: Projeção explícita
      .eq('id', photoId)
      .single();
    const photo = photoData as DownloadPhoto | null;

    if (photoError || !photo) {
      return NextResponse.json({ error: 'Foto não encontrada ou sem permissão' }, { status: 404 });
    }

    const event = photo.events as PhotoEvent | null;
    if (!event) {
      return NextResponse.json({ error: 'Evento da foto não encontrado' }, { status: 404 });
    }

    // 2. LOGIC: Is it free or paid?
    let authorized = false;

    if (event.is_paid === false) {
      // Free events are authorized for everyone (or you could require login here)
      authorized = true;
    } else {
      // Paid events require a session and a paid order
      if (!user) {
        return NextResponse.json({ error: 'Faça login para baixar suas fotos' }, { status: 401 });
      }

      // Check if this photoId is in any of the user's paid orders
      const { data: paidOrders } = await supabaseAdmin
        .from('orders')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'paid')
        .contains('items', [photoId]);

      if (paidOrders && paidOrders.length > 0) {
        authorized = true;
      }
    }

    if (!authorized) {
      return NextResponse.json({ error: 'Acesso negado. Esta foto precisa ser comprada.' }, { status: 403 });
    }

    // 3. GENERATE SIGNED URL (Resilient to bucket name)
    const buckets = [PHOTO_STORAGE_BUCKET, LEGACY_PHOTO_STORAGE_BUCKET];
    let signedUrl = null;
    let lastError = null;

    for (const b of buckets) {
      const { data: signedData, error: signedError } = await supabaseAdmin.storage
        .from(b)
        .createSignedUrl(photo.storage_path, 3600, {
            download: true
        });
      
      if (!signedError && signedData?.signedUrl) {
        signedUrl = signedData.signedUrl;
        break;
      }
      lastError = signedError;
    }

    if (!signedUrl) {
      console.error('Signed URL Error:', lastError);
      return NextResponse.json({ error: 'Erro ao localizar arquivo no storage' }, { status: 500 });
    }

    return NextResponse.json({ url: signedUrl });

  } catch (err: unknown) {
    console.error('Download API Error:', err);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
