"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Brain, Cpu, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import styles from './AIIndexer.module.css';
import { loadFaceModels, indexEventPhotos } from '@/utils/face-indexing';

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
    try {
      await loadFaceModels();
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

    const result = await indexEventPhotos(eventId, ({ done, total }) => {
      setStatus(`Processando IA: ${done + 1} de ${total}...`);
      setProgress(total > 0 ? Math.round((done / total) * 100) : 0);
      setStats(prev => ({ ...prev, indexed: prev.indexed + (done > 0 ? 1 : 0), pending: Math.max(prev.pending - (done > 0 ? 1 : 0), 0) }));
    });

    if (result.processed === 0) {
      setStatus("Todas as fotos já estão indexadas! ✨");
    } else {
      setStatus("Indexação concluída com sucesso! 🚀");
    }
    await fetchStats();
    setIsProcessing(false);
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
