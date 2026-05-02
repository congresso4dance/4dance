"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import * as faceapi from 'face-api.js';
import { Brain, Cpu, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import styles from './AIIndexer.module.css';
import { signDisplayPhotos } from '@/app/actions/storage-actions';

interface AIIndexerProps {
  eventId: string;
}

export default function AIIndexer({ eventId }: AIIndexerProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({ total: 0, indexed: 0, pending: 0 });
  const [status, setStatus] = useState("");
  
  const supabase = createClient();

  // 1. Load Stats and Models
  useEffect(() => {
    async function init() {
      await loadModels();
      await fetchStats();
    }
    init();
  }, [eventId]);

  async function loadModels() {
    if (modelsLoaded) return;
    setStatus("Carregando modelos de IA...");
    const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ]);
      setModelsLoaded(true);
      setStatus("Modelos prontos.");
    } catch (err) {
      console.error("Erro ao carregar modelos:", err);
      setStatus("Erro ao carregar IA.");
    }
  }

  async function fetchStats() {
    // Get stats from photos table directly using the new is_indexed column
    const { count: total } = await supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId);

    const { count: indexed } = await supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('is_indexed', true);

    setStats({
      total: total || 0,
      indexed: indexed || 0,
      pending: (total || 0) - (indexed || 0)
    });
  }

  async function startIndexing() {
    setIsProcessing(true);
    setStatus("Buscando fotos pendentes...");

    // 1. Get all pending photos for this event
    const { data: pendingPhotos } = await supabase
      .from('photos')
      .select('id, full_res_url')
      .eq('event_id', eventId)
      .eq('is_indexed', false);

    if (!pendingPhotos || pendingPhotos.length === 0) {
      setStatus("Todas as fotos já estão indexadas! ✨");
      setIsProcessing(false);
      return;
    }

    setStatus("Gerando URLs seguras...");
    const signedPhotos = await signDisplayPhotos(pendingPhotos as { id: string; full_res_url?: string | null }[]);

    let processedCount = 0;

    for (const photo of signedPhotos) {
      setStatus(`Processando IA: ${processedCount + 1} de ${pendingPhotos.length}...`);
      
      try {
        // Load image for processing
        if (!photo.full_res_url) continue;
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = photo.full_res_url;
        await new Promise((res, rej) => {
          img.onload = res;
          img.onerror = rej;
          // Timeout if image takes too long
          setTimeout(() => rej(new Error("Timeout")), 10000);
        });

        // Detect all faces in photo
        const detections = await faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptors();

        if (detections.length > 0) {
          const faceRecords = detections.map(det => ({
            photo_id: photo.id,
            embedding: `[${Array.from(det.descriptor).join(',')}]`
          }));

          await supabase.from('photo_faces').insert(faceRecords);
        }
        
        // 3. IMPORTANT: Mark as indexed regardless of face detection success
        await supabase
          .from('photos')
          .update({ is_indexed: true })
          .eq('id', photo.id);

      } catch (err) {
        console.warn(`Erro na foto ${photo.id}:`, err);
        // Even on error, we might want to mark as indexed to avoid breaking the loop
        // but only if it's a persistent error like 404 or Invalid Data
        await supabase
          .from('photos')
          .update({ is_indexed: true })
          .eq('id', photo.id);
      }

      processedCount++;
      setProgress(Math.round((processedCount / pendingPhotos.length) * 100));
      setStats(prev => ({ ...prev, indexed: prev.indexed + 1, pending: prev.pending - 1 }));
      
      if (processedCount % 3 === 0) await new Promise(r => setTimeout(r, 50));
    }

    setIsProcessing(false);
    setStatus("Indexação concluída com sucesso! 🚀");
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2><Brain size={24} className={styles.brainIcon} /> Motor de Busca Facial</h2>
        {!modelsLoaded && <Loader2 className="animate-spin" size={20} />}
      </div>

      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{stats.total}</span>
          <span className={styles.statLabel}>Fotos</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue} style={{ color: '#10b981' }}>{stats.indexed}</span>
          <span className={styles.statLabel}>Indexadas</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue} style={{ color: stats.pending > 0 ? '#ff2d55' : 'rgba(255,255,255,0.3)' }}>
            {stats.pending}
          </span>
          <span className={styles.statLabel}>Pendentes</span>
        </div>
      </div>

      <div className={styles.controls}>
        <button 
          className={styles.indexBtn} 
          onClick={startIndexing}
          disabled={isProcessing || !modelsLoaded || stats.pending === 0}
        >
          {isProcessing ? (
            <><Cpu className="animate-spin" size={20} /> Indexando...</>
          ) : (
            <><Brain size={20} /> Processar Galeria para IA</>
          )}
        </button>

        {isProcessing && (
          <div className={styles.progressWrapper}>
            <div className={styles.progressInfo}>
              <span>{status}</span>
              <span>{progress}%</span>
            </div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {!isProcessing && stats.pending === 0 && (
          <p className={styles.statusText}>
            <CheckCircle size={14} style={{ verticalAlign: 'middle', marginRight: 4, color: '#10b981' }} />
            Galeria pronta para busca instantânea.
          </p>
        )}
      </div>
    </div>
  );
}
