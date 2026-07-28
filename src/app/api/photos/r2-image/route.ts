import { NextResponse } from 'next/server';
import { downloadFromR2 } from '@/utils/r2-storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Faz proxy de uma foto guardada no Cloudflare R2 pro navegador.
 *
 * Por que existe: o Cloudflare bloqueia (HTTP 503) requisições feitas
 * diretamente do navegador (via <img src>) pra API S3 do R2 usando URL
 * assinada — é uma proteção anti-hotlinking do próprio R2/Cloudflare que
 * afeta esse tipo de requisição de subrecurso. Buscando o arquivo aqui no
 * servidor (com as credenciais do R2, nunca expostas ao cliente) e
 * devolvendo os bytes direto, contornamos isso sem precisar tornar o bucket
 * público — o nível de acesso continua o mesmo de antes (só quem tem o link
 * da galeria vê a foto).
 *
 * GET /api/photos/r2-image?key=<chave do objeto no R2>
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');

  if (!key) {
    return NextResponse.json({ error: 'key é obrigatório' }, { status: 400 });
  }

  try {
    const { buffer, contentType } = await downloadFromR2(key);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType || 'image/jpeg',
        // Imagens não mudam depois de enviadas — pode cachear no navegador/CDN por bastante tempo.
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
  } catch (err: any) {
    console.error(`Erro ao buscar imagem do R2 (key: ${key}):`, err);
    return NextResponse.json({ error: 'Foto não encontrada' }, { status: 404 });
  }
}
