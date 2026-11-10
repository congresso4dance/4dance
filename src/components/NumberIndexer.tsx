"use client";

import { useState, useEffect } from 'react';
import { Hash, Cpu, CheckCircle, Loader2 } from 'lucide-react';
import styles from './AIIndexer.module.css';
import { getNumberIndexingStats, detectBibNumbersBatch } from '@/app/actions/number-detection';

interface NumberIndexerProps {
  eventId: string;
}

export default function NumberIndexer({ eventId }: NumberIndexerProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState({ total: 0, indexed: 0, pending: 0 });
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    fetchStats();
     
  }, [eventId]);

  async function fetchStats() {
    const result = await getNumberIndexingStats(eventId);
    setStats(result);
  }

  async function startIndexing() {
    setIsProcessing(true);
    setStatus("Lendo números de competidor com IA...");

    let remaining = stats.pending;
    const initialPending = stats.pending || 1;

    while (remaining > 0) {
      const result = await detectBibNumbersBatch(eventId, 6);
      if (result.error) {
        setStatus(`Erro: ${result.error}`);
        break;
      }
      if (result.processed === 0) break;

      remaining = result.remaining;
      const done = initialPending - remaining;
      setProgress(Math.round((done / initialPending) * 100));
      setStatus(`Processando: ${done} de ${initialPending}...`);
      await fetchStats();
    }

    setStatus(remaining === 0 ? "Concluído! Números prontos pra busca. 🔢" : "Pausado.");
    setIsProcessing(false);
    await fetchStats();
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2><Hash size={24} className={styles.brainIcon} /> Motor de Busca por Número</h2>
      </div>

      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{stats.total}</span>
          <span className={styles.statLabel}>Fotos</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue} style={{ color: '#10b981' }}>{stats.indexed}</span>
          <span className={styles.statLabel}>Lidas</span>
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
          disabled={isProcessing || stats.pending === 0}
        >
          {isProcessing ? (
            <><Cpu className="animate-spin" size={20} /> Lendo números...</>
          ) : (
            <><Hash size={20} /> Ler Números das Fotos</>
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

        {!isProcessing && stats.pending === 0 && stats.total > 0 && (
          <p className={styles.statusText}>
            <CheckCircle size={14} style={{ verticalAlign: 'middle', marginRight: 4, color: '#10b981' }} />
            Busca por número pronta pros clientes.
          </p>
        )}
      </div>
    </div>
  );
}
