import { S3Client, PutObjectCommand, DeleteObjectsCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Cliente para o Cloudflare R2 (storage compatível com S3, sem custo de egress).
 * O banco de dados continua no Supabase — só os ARQUIVOS de foto (full-res e
 * thumbnail) saem de lá e passam a viver no R2. Isso isola o consumo de banda
 * da galeria (que é o que mais cresce) da cota do projeto Supabase.
 *
 * Variáveis de ambiente necessárias (ver .env.local.example):
 *  - R2_ACCOUNT_ID
 *  - R2_ACCESS_KEY_ID
 *  - R2_SECRET_ACCESS_KEY
 *  - R2_BUCKET_NAME
 */

const R2_REF_PREFIX = 'r2://';

let cachedClient: S3Client | null = null;

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente ausente: ${name}. Configure o Cloudflare R2 no .env.local.`);
  }
  return value;
}

export function getR2Client(): S3Client {
  if (cachedClient) return cachedClient;

  const accountId = getRequiredEnv('R2_ACCOUNT_ID');
  const accessKeyId = getRequiredEnv('R2_ACCESS_KEY_ID');
  const secretAccessKey = getRequiredEnv('R2_SECRET_ACCESS_KEY');

  cachedClient = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    // O SDK novo da AWS manda por padrão um header/query de checksum
    // (x-amz-checksum-mode) que o Cloudflare R2 não suporta direito e
    // responde com 503. Desligando isso, a assinatura fica compatível.
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });

  return cachedClient;
}

function getBucketName(): string {
  return getRequiredEnv('R2_BUCKET_NAME');
}

/** Referência estável salva no banco (photos.full_res_url / thumbnail_url). */
export function toR2Ref(key: string): string {
  return `${R2_REF_PREFIX}${key}`;
}

/** Retorna a key do objeto se `value` for uma referência R2, senão null. */
export function parseR2Ref(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith(R2_REF_PREFIX)) return null;
  return value.slice(R2_REF_PREFIX.length);
}

export async function uploadToR2(key: string, buffer: Buffer, contentType = 'image/jpeg'): Promise<void> {
  const client = getR2Client();
  await client.send(new PutObjectCommand({
    Bucket: getBucketName(),
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));
}

/** Remove um lote de objetos do R2 (equivalente ao supabase.storage.remove). */
export async function deleteFromR2(keys: string[]): Promise<void> {
  if (!keys || keys.length === 0) return;
  const client = getR2Client();

  // DeleteObjects aceita no máximo 1000 chaves por chamada.
  const chunkSize = 1000;
  for (let i = 0; i < keys.length; i += chunkSize) {
    const chunk = keys.slice(i, i + chunkSize);
    await client.send(new DeleteObjectsCommand({
      Bucket: getBucketName(),
      Delete: { Objects: chunk.map((Key) => ({ Key })) },
    }));
  }
}

/** Gera uma URL assinada temporária (GET) para um objeto privado no R2. */
export async function getR2SignedUrl(key: string, expiresIn = 21600, downloadFilename?: string): Promise<string> {
  const client = getR2Client();
  const command = new GetObjectCommand({
    Bucket: getBucketName(),
    Key: key,
    ...(downloadFilename
      ? { ResponseContentDisposition: `attachment; filename="${downloadFilename}"` }
      : {}),
  });
  return getSignedUrl(client, command, { expiresIn });
}

/**
 * Baixa um objeto do R2 direto pelo servidor (usando nossas credenciais,
 * nunca expostas ao navegador). Usado pela rota de proxy de imagem — o
 * Cloudflare bloqueia (503) requisições de <img> direto do navegador pra API
 * S3 do R2 (proteção contra hotlinking), mas do servidor funciona normal.
 */
export async function downloadFromR2(key: string): Promise<{ buffer: Buffer; contentType?: string }> {
  const client = getR2Client();
  const result = await client.send(new GetObjectCommand({ Bucket: getBucketName(), Key: key }));
  if (!result.Body) throw new Error('Objeto sem conteúdo');
  const bytes = await result.Body.transformToByteArray();
  return { buffer: Buffer.from(bytes), contentType: result.ContentType };
}

/** URL (própria, do nosso servidor) que faz proxy de uma foto do R2 pro navegador. */
export function toR2ProxyUrl(key: string): string {
  return `/api/photos/r2-image?key=${encodeURIComponent(key)}`;
}
