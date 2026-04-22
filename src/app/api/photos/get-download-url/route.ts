import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const photoId = searchParams.get('photoId');

    if (!photoId) {
      return NextResponse.json({ error: 'ID da foto é obrigatório' }, { status: 400 });
    }

    const supabaseServer = await createServerClient();
    const { data: { user } } = await supabaseServer.auth.getUser();

    // 1. Fetch photo and its event pricing policy
    const { data: photo, error: photoError } = await supabaseAdmin
      .from('photos')
      .select('*, events(id, is_paid)')
      .eq('id', photoId)
      .single();

    if (photoError || !photo) {
      return NextResponse.json({ error: 'Foto não encontrada' }, { status: 404 });
    }

    const event = photo.events as any;

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

    // 3. GENERATE SIGNED URL (Expire in 1 hour)
    const bucket = 'photos'; // Bucket configurado
    const { data: signedData, error: signedError } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(photo.storage_path, 3600, {
          download: true
      });

    if (signedError) {
      return NextResponse.json({ error: 'Erro ao gerar link seguro' }, { status: 500 });
    }

    return NextResponse.json({ url: signedData.signedUrl });

  } catch (err: any) {
    console.error('Download API Error:', err);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
