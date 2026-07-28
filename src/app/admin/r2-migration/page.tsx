"use client";

import { useState, useRef } from 'react';
import { Database, Play, Pause, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import AdminNavbar from '@/components/AdminNavbar';
import styles from '../ai-worker/ai-worker.module.css';

// Eventos "Samba ao Quadrado" escolhidos para a primeira leva de migração.
// O evento-base "Samba ao Quadrado" (sem dia) ficou de fora a pedido do
// usuário — é antigo e não precisa migrar agora.
const TARGET_EVENTS = [
  { id: 'b2d0653e-ff81-4115-b22e-4faeb94aa41b', title: 'Samba ao Quadrado - Domingo' },
  { id: '5e0be7a8-5417-44b6-aaa5-79633db44e4e', title: 'Samba ao Quadrado - Quinta' },
  { id: '745a0818-3a5c-4c8c-be54-ff1bc93de557', title: 'Samba ao Quadrado - Sabado' },
  { id: '17407a1c-662d-4fc8-af5b-ddb888ecf460', title: 'Samba ao Quadrado - Sexta' },
];

export default function R2MigrationPage() {
  const [isRunning, setIsRunning] = useState(false);
  const isRunningRef = useRef(false);
  const [logs, setLogs] = useState<{ time: string; message: string; type: string }[]>([]);
  const [totals, setTotals] = useState({ migrated: 0, errors: 0, remaining: 0 });
  const [status, setStatus] = useState('Pronto para iniciar.');

  function addLog(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
    setLogs(prev => [{ time: new Date().toLocaleTimeString(), message, type }, ...prev].slice(0, 80));
  }

  async function runBatch() {
    if (!isRunningRef.current) return;

    try {
      const res = await fetch('/api/admin/migrate-photos-to-r2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventIds: TARGET_EVENTS.map(e => e.id), limit: 40 }),
      });

      const data = await res.json();

      if (!res.ok) {
        addLog(`Erro: ${data.error || res.status}`, 'error');
        setStatus('Parado por erro. Veja os logs.');
        setIsRunning(false);
        isRunningRef.current = false;
        return;
      }

      setTotals(prev => ({
        migrated: prev.migrated + data.migrated,
        errors: prev.errors + data.errors,
        remaining: data.remaining,
      }));

      addLog(`Lote: ${data.migrated} migradas, ${data.errors} erros. Faltam ${data.remaining}.`, data.errors > 0 ? 'warning' : 'success');
      if (data.errorDetails?.length) {
        data.errorDetails.forEach((e: string) => addLog(`  ↳ ${e}`, 'error'));
      }

      if (data.done) {
        addLog('🏁 Migração concluída para os eventos selecionados!', 'success');
        setStatus('Concluído.');
        setIsRunning(false);
        isRunningRef.current = false;
        return;
      }

      setStatus(`Migrando... faltam ${data.remaining} fotos.`);
      setTimeout(runBatch, 50);
    } catch (err: any) {
      addLog(`Falha de rede: ${err.message}. Tentando de novo em 5s...`, 'warning');
      setTimeout(runBatch, 5000);
    }
  }

  function start() {
    if (isRunning) {
      setIsRunning(false);
      isRunningRef.current = false;
      addLog('Parado pelo usuário.', 'warning');
      return;
    }
    setIsRunning(true);
    isRunningRef.current = true;
    addLog('Iniciando migração Supabase → Cloudflare R2...', 'info');
    runBatch();
  }

  return (
    <div className={styles.container}>
      <AdminNavbar active="settings" />

      <header className={styles.header}>
        <div className={styles.title}>
          <Database size={32} className={styles.brainIcon} />
          <h1>Migração de Fotos: Supabase → R2</h1>
        </div>
      </header>

      <section className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: '#10b981' }}>{totals.migrated}</span>
          <span className={styles.statLabel}>Migradas</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: totals.errors > 0 ? '#ff2d55' : '#ccc' }}>{totals.errors}</span>
          <span className={styles.statLabel}>Erros</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{totals.remaining}</span>
          <span className={styles.statLabel}>Restantes</span>
        </div>
      </section>

      <main className={styles.mainSection}>
        <p style={{ marginBottom: '1rem', opacity: 0.7, fontSize: '0.9rem' }}>
          Eventos incluídos nesta leva: {TARGET_EVENTS.map(e => e.title).join(', ')}.
        </p>

        <div className={styles.controls}>
          <button className={styles.startBtn} onClick={start}>
            {isRunning ? <><Pause size={20} /> Parar</> : <><Play size={20} /> Iniciar Migração</>}
          </button>
          <p className={styles.statusText}>{status}</p>
        </div>

        <div className={styles.logs}>
          {logs.map((log, i) => (
            <div key={i} className={`${styles.logEntry} ${styles[`log${log.type.charAt(0).toUpperCase()}${log.type.slice(1)}`]}`}>
              [{log.time}] {log.message}
            </div>
          ))}
          {logs.length === 0 && <p style={{ opacity: 0.3 }}>Nenhum log ainda.</p>}
        </div>
      </main>
    </div>
  );
}
