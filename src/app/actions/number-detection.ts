"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from '@/utils/supabase/server';
import { getSupabaseAdmin, signPhotoUrls } from '@/utils/storage-helper';
import { downloadFromR2, parseR2Ref } from '@/utils/r2-storage';

/**
 * Detecção de número de peito/competidor (bib number) via IA — relevante pra
 * campeonatos de dança com numeração de casal/atleta, igual à Foco Radical
 * faz pra corridas. Roda por evento, em lotes, e grava em photos.bib_numbers.
 *
 * Só quem está de fato ligado ao evento (admin, dono ou colaborador
 * aceito via event_photographers) pode disparar a indexação.
 */
async function assertEventAccess(eventId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autorizado: sessão não encontrada.");

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role?.toLowerCase();
  if (role === 'admin' || role === 'owner') return;

  const { data: link } = await supabase
    .from('event_photographers')
    .select('photographer_id')
    .eq('event_id', eventId)
    .eq('photographer_id', user.id)
    .maybeSingle();

  if (!link) throw new Error("Você não está vinculado a este evento.");
}

export async function getNumberIndexingStats(eventId: string) {
  const supabaseAdmin = getSupabaseAdmin();
  const { count: total } = await supabaseAdmin
    .from('photos')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId);

  const { count: indexed } = await supabaseAdmin
    .from('photos')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('numbers_indexed', true);

  return { total: total || 0, indexed: indexed || 0, pending: (total || 0) - (indexed || 0) };
}

/**
 * Processa um lote de fotos pendentes de detecção de número. Devolve poucas
 * por chamada (o modelo de visão é mais lento que face-api.js local) — o
 * componente cliente chama isso em loop até `remaining` zerar.
 */
export async function detectBibNumbersBatch(eventId: string, limit = 6) {
  await assertEventAccess(eventId);

  const apiKey = process.env.GOOGLE_AI_STUDIO_KEY;
  if (!apiKey) {
    return { processed: 0, withNumbers: 0, remaining: 0, error: "Chave de IA não configurada no servidor." };
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data: pending } = await supabaseAdmin
    .from('photos')
    .select('id, full_res_url')
    .eq('event_id', eventId)
    .eq('numbers_indexed', false)
    .limit(limit);

  if (!pending || pending.length === 0) {
    return { processed: 0, withNumbers: 0, remaining: 0 };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `Você está olhando uma foto de um evento de dança de salão ou campeonato esportivo.
Alguns competidores usam um número de identificação (bib number), geralmente preso na roupa, nas costas ou no peito.
Leia com atenção e retorne TODOS os números de competidor visíveis na imagem.
Se não houver nenhum número visível, retorne uma lista vazia.
Retorne APENAS JSON no formato: {"numbers": ["123", "456"]}`;

  let processed = 0;
  let withNumbers = 0;

  for (const photo of pending) {
    try {
      const key = parseR2Ref(photo.full_res_url);
      if (!key) {
        await supabaseAdmin.from('photos').update({ numbers_indexed: true }).eq('id', photo.id);
        processed++;
        continue;
      }

      const { buffer, contentType } = await downloadFromR2(key);
      const imagePart = {
        inlineData: {
          data: buffer.toString('base64'),
          mimeType: contentType || 'image/jpeg',
        },
      };

      const result = await model.generateContent([prompt, imagePart]);
      const responseText = result.response.text();
      const cleanJson = responseText.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      const numbers: string[] = Array.isArray(parsed.numbers)
        ? parsed.numbers.map((n: unknown) => String(n).trim()).filter(Boolean)
        : [];

      await supabaseAdmin
        .from('photos')
        .update({ bib_numbers: numbers, numbers_indexed: true })
        .eq('id', photo.id);

      if (numbers.length > 0) withNumbers++;
    } catch (err) {
      console.warn(`[number-detection] Falha na foto ${photo.id}:`, err);
      // Marca como processada mesmo com erro, pra não travar o lote pra sempre
      // numa foto problemática.
      await supabaseAdmin.from('photos').update({ numbers_indexed: true }).eq('id', photo.id);
    }
    processed++;
  }

  const stats = await getNumberIndexingStats(eventId);
  return { processed, withNumbers, remaining: stats.pending };
}

/**
 * Busca pública (sem login) de fotos por número de competidor — usada na
 * página do evento, ao lado da busca por selfie. Cobre o evento inteiro, não
 * só as fotos já carregadas na tela (ao contrário do filtro por nome de
 * arquivo, que só olha a página atual).
 */
export async function searchPhotosByBibNumber(eventId: string, number: string) {
  const cleaned = number.trim();
  if (!cleaned) return { photos: [] };

  const supabaseAdmin = getSupabaseAdmin();

  const { data: event } = await supabaseAdmin
    .from('events')
    .select('is_paid')
    .eq('id', eventId)
    .single();

  const fields = event?.is_paid
    ? 'id,event_id,thumbnail_url,storage_path,created_at,bib_numbers'
    : '*';

  const { data: photos, error } = await supabaseAdmin
    .from('photos')
    .select(fields)
    .eq('event_id', eventId)
    .contains('bib_numbers', [cleaned])
    .limit(200);

  if (error) {
    console.error('[number-detection] Erro na busca por número:', error);
    return { photos: [], error: error.message };
  }

  const signed = await signPhotoUrls((photos || []) as unknown as Array<{ id: string; thumbnail_url?: string | null; full_res_url?: string | null }>);

  // Pra eventos pagos, a exibição na galeria usa o thumbnail como preview
  // público — full_res só é liberado depois da compra, mesma regra da
  // galeria principal.
  const finalPhotos = event?.is_paid
    ? signed.map((p) => ({ ...p, full_res_url: p.full_res_url || p.thumbnail_url }))
    : signed;

  return { photos: finalPhotos };
}
