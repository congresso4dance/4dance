import { NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getR2Client } from '@/utils/r2-storage';
import { getSupabaseAdmin } from '@/utils/storage-helper';
import { createClient } from '@/utils/supabase/server';

export const runtime = 'nodejs';

// Proxy de streaming pro R2 com suporte a Range (necessário pro player
// conseguir avançar/voltar no vídeo, e pra não carregar o arquivo inteiro
// na memória da function). O R2 tem a mesma proteção anti-hotlink que
// bloqueia <img>/<video> direto no navegador contra a API S3, então tudo
// passa por aqui — igual já é feito pra foto em /api/photos/r2-image.
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabaseAdmin = getSupabaseAdmin();

  const { data: video } = await supabaseAdmin
    .from('videos')
    .select('id, storage_path')
    .eq('id', id)
    .single();

  if (!video) {
    return NextResponse.json({ error: 'Vídeo não encontrado' }, { status: 404 });
  }

  const url = new URL(req.url);
  const wantsDownload = url.searchParams.get('download') === '1';

  // Só permite o Content-Disposition de download (e o nome de arquivo "limpo")
  // se o usuário logado realmente tem um pedido pago desse vídeo. Sem isso,
  // não muda o que dá pra assistir (o arquivo é o mesmo antes e depois da
  // compra — é assim de propósito, ver decisão do piloto), mas evita que o
  // link force um "Salvar Como" grátis pra quem não comprou.
  let allowDownload = false;
  if (wantsDownload) {
    const supabaseUser = await createClient();
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (user) {
      const { data: order } = await supabaseAdmin
        .from('video_orders')
        .select('id')
        .eq('video_id', id)
        .eq('user_id', user.id)
        .eq('status', 'paid')
        .maybeSingle();
      allowDownload = Boolean(order);
    }
  }

  const client = getR2Client();
  const range = req.headers.get('range') || undefined;

  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: video.storage_path,
    Range: range,
    ...(allowDownload
      ? { ResponseContentDisposition: `attachment; filename="4dance-video-${id.slice(-6)}.mp4"` }
      : {}),
  });

  let result;
  try {
    result = await client.send(command);
  } catch (err: any) {
    return NextResponse.json({ error: `Storage (R2): ${err.message}` }, { status: 500 });
  }

  if (!result.Body) {
    return NextResponse.json({ error: 'Objeto sem conteúdo' }, { status: 500 });
  }

  const headers = new Headers();
  headers.set('Content-Type', result.ContentType || 'video/mp4');
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Cache-Control', 'private, max-age=0, must-revalidate');
  if (result.ContentLength != null) headers.set('Content-Length', String(result.ContentLength));
  if (result.ContentRange) headers.set('Content-Range', result.ContentRange);
  if (allowDownload) headers.set('Content-Disposition', `attachment; filename="4dance-video-${id.slice(-6)}.mp4"`);

  const status = range ? 206 : 200;
  // O SDK v3 devolve um stream web-compatible no runtime Node do Next.js.
  return new NextResponse(result.Body as unknown as ReadableStream, { status, headers });
}
