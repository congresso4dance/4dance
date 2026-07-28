import * as faceapi from 'face-api.js';
import { createClient } from '@/utils/supabase/client';
import { signDisplayPhotos } from '@/app/actions/storage-actions';

// Mesmos modelos usados pelo AIIndexer.tsx (detecção + landmarks + descritor
// facial). Carregados uma única vez por sessão de navegador e reaproveitados
// tanto pelo botão manual "Processar Galeria para IA" quanto pela indexação
// automática que roda logo depois do upload de fotos no admin.
const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';

let modelsLoadedPromise: Promise<void> | null = null;

export function loadFaceModels(): Promise<void> {
  if (!modelsLoadedPromise) {
    modelsLoadedPromise = Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]).then(() => undefined);
  }
  return modelsLoadedPromise;
}

export interface IndexProgress {
  done: number;
  total: number;
}

/**
 * Roda a detecção de rosto (face-api.js, no navegador) em todas as fotos
 * ainda não indexadas (is_indexed = false) de um evento, e grava os
 * embeddings encontrados em photo_faces. Precisa da aba do navegador aberta
 * até terminar — a detecção facial roda no cliente, não no servidor.
 */
export async function indexEventPhotos(
  eventId: string,
  onProgress?: (p: IndexProgress) => void
): Promise<{ processed: number; withFaces: number }> {
  const supabase = createClient();
  await loadFaceModels();

  const { data: pendingPhotos } = await supabase
    .from('photos')
    .select('id, full_res_url')
    .eq('event_id', eventId)
    .eq('is_indexed', false);

  if (!pendingPhotos || pendingPhotos.length === 0) {
    return { processed: 0, withFaces: 0 };
  }

  const signedPhotos = await signDisplayPhotos(
    pendingPhotos as { id: string; full_res_url?: string | null }[]
  );

  let processed = 0;
  let withFaces = 0;

  for (const photo of signedPhotos) {
    onProgress?.({ done: processed, total: pendingPhotos.length });

    try {
      if (!photo.full_res_url) continue;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = photo.full_res_url as string;
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
        setTimeout(() => rej(new Error('Timeout')), 10000);
      });

      const detections = await faceapi
        .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (detections.length > 0) {
        withFaces++;
        const faceRecords = detections.map((det) => ({
          photo_id: photo.id,
          embedding: `[${Array.from(det.descriptor).join(',')}]`,
        }));
        await supabase.from('photo_faces').insert(faceRecords);
      }

      await supabase.from('photos').update({ is_indexed: true }).eq('id', photo.id);
    } catch (err) {
      console.warn(`Erro na foto ${photo.id}:`, err);
      // Marca como indexada mesmo em erro, pra não travar o loop pra sempre
      // numa foto problemática (ex: 404, timeout, imagem corrompida).
      await supabase.from('photos').update({ is_indexed: true }).eq('id', photo.id);
    }

    processed++;
    onProgress?.({ done: processed, total: pendingPhotos.length });

    if (processed % 3 === 0) await new Promise((r) => setTimeout(r, 50));
  }

  return { processed, withFaces };
}
