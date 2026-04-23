"use client";

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import * as faceapi from 'face-api.js';
import { Brain, Cpu, CheckCircle, AlertCircle, Loader2, Play, Pause, Activity, RefreshCw } from 'lucide-react';
import AdminNavbar from '@/components/AdminNavbar';
import styles from './ai-worker.module.css';

import { getPendingPhotos, markPhotoAsIndexed, resetAllIndexing } from '@/app/actions/ai-engine';

export default function GlobalAIWorker() {
  const [isProcessing, setIsProcessing] = useState(false);
  const isProcessingRef = useRef(false); // Ref para evitar problemas de closure na recursão
  
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({ total: 0, indexed: 0, pending: 0 });
  const [logs, setLogs] = useState<any[]>([]);
  const [currentAction, setCurrentAction] = useState("Aguardando início...");
  
  const supabase = createClient();

  useEffect(() => {
    async function init() {
      await loadModels();
      await fetchGlobalStats();
    }
    init();
  }, []);

  // Sincroniza o Ref com o State
  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  async function loadModels() {
    if (modelsLoaded) return;
    addLog("Carregando modelos de rede neural...", "info");
    const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ]);
      setModelsLoaded(true);
      addLog("Modelos de IA carregados com sucesso.", "success");
    } catch (err) {
      addLog("Erro ao carregar modelos. Verifique sua conexão.", "error");
    }
  }

  async function fetchGlobalStats() {
    const { count: total } = await supabase.from('photos').select('*', { count: 'exact', head: true });
    const { count: indexed } = await supabase.from('photos').select('*', { count: 'exact', head: true }).eq('is_indexed', true);

    setStats({
      total: total || 0,
      indexed: indexed || 0,
      pending: (total || 0) - (indexed || 0)
    });
  }

  function addLog(message: string, type: "info" | "success" | "error" | "warning" = "info") {
    setLogs(prev => [{
      time: new Date().toLocaleTimeString(),
      message,
      type
    }, ...prev].slice(0, 50));
  }

  async function runMassiveIndexing() {
    if (isProcessing) {
        setIsProcessing(false);
        addLog("Solicitando parada do motor...", "warning");
        return;
    }
    
    setIsProcessing(true);
    isProcessingRef.current = true;
    addLog("Motor Elite Ativado! Iniciando varredura contínua...", "info");
    processNextBatch(0);
  }

  async function processNextBatch(totalProcessedSinceStart: number) {
    if (!isProcessingRef.current) {
        addLog("Motor desligado pelo usuário.", "info");
        return;
    }

    setCurrentAction("Buscando lote de fotos...");
    let pending;
    try {
        // Aumentado para 30 para manter o motor alimentado
        pending = await getPendingPhotos(30);
    } catch (err: any) {
        addLog(`Falha: ${err.message}. Retentando em 5s...`, "warning");
        setTimeout(() => processNextBatch(totalProcessedSinceStart), 5000);
        return;
    }

    if (!pending || pending.length === 0) {
        addLog("🏁 Fila limpa! Todas as fotos foram processadas.", "success");
        setIsProcessing(false);
        setCurrentAction("Concluído.");
        return;
    }

    addLog(`Lote de ${pending.length} fotos recebido. Analisando em PARALELO...`, "info");

    const CONCURRENCY = 3; // 3 fotos ao mesmo tempo
    for (let i = 0; i < pending.length; i += CONCURRENCY) {
        if (!isProcessingRef.current) break;
        
        const currentSlice = pending.slice(i, i + CONCURRENCY);
        
        await Promise.all(currentSlice.map(async (photo) => {
            try {
                setCurrentAction(`Processando: ${photo.id.substring(0, 8)}...`);
                
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.src = `${photo.full_res_url}${photo.full_res_url.includes('?') ? '&' : '?'}cache_bust=${Date.now()}`;
                
                await new Promise((res, rej) => {
                    img.onload = res;
                    img.onerror = () => rej(new Error("Erro de download (403/404)"));
                    setTimeout(() => rej(new Error("Timeout (Imagem pesada)")), 20000); // Aumentado para 20s
                });

                const detections = await faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
                    .withFaceLandmarks()
                    .withFaceDescriptors();

                const faceEmbeddings = detections.map(det => ({
                    embedding: `[${Array.from(det.descriptor).join(',')}]`
                }));

                await markPhotoAsIndexed(photo.id, faceEmbeddings);
                
                totalProcessedSinceStart++;
                setStats(prev => ({ ...prev, indexed: prev.indexed + 1, pending: Math.max(0, prev.pending - 1) }));
                
                if (detections.length > 0) {
                    addLog(`✓ ${detections.length} faces em ${photo.id.substring(0, 5)}`, "success");
                } else {
                    addLog(`○ Sem faces em ${photo.id.substring(0, 5)}`, "info");
                }
                
                // Limpeza de memória
                img.src = "";
            } catch (err: any) {
                addLog(`! Pulei ${photo.id.substring(0, 5)}: ${err.message}`, "warning");
                await markPhotoAsIndexed(photo.id, []);
                setStats(prev => ({ ...prev, indexed: prev.indexed + 1, pending: Math.max(0, prev.pending - 1) }));
            }
        }));
    }

    // Gatilho automático para o próximo lote
    if (isProcessingRef.current) {
        setTimeout(() => processNextBatch(totalProcessedSinceStart), 100);
    }
  }

  return (
    <div className={styles.container}>
      <AdminNavbar active="settings" />
      
      <header className={styles.header}>
        <div className={styles.title}>
          <Brain size={32} className={styles.brainIcon} />
          <h1>Central de Processamento IA</h1>
        </div>
        <div className={styles.engineStatus}>
          {modelsLoaded ? (
            <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={16} /> Motor Ativo
            </span>
          ) : (
            <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Loader2 className="animate-spin" size={16} /> Carregando Modelos...
            </span>
          )}
        </div>
      </header>

      <section className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats.total}</span>
          <span className={styles.statLabel}>Total de Fotos</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: '#10b981' }}>{stats.indexed}</span>
          <span className={styles.statLabel}>Indexadas</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: stats.pending > 0 ? '#ff2d55' : '#ccc' }}>
            {stats.pending}
          </span>
          <span className={styles.statLabel}>Pendentes</span>
        </div>
      </section>

      <main className={styles.mainSection}>
        <div className={styles.controls}>
          <button 
            className={styles.startBtn} 
            onClick={runMassiveIndexing}
            disabled={!modelsLoaded || isProcessing || stats.pending === 0}
          >
            {isProcessing ? <><Pause size={20} /> Processando...</> : <><Play size={20} /> Iniciar Indexação Global</>}
          </button>

          {isProcessing && (
            <div className={styles.progressWrapper}>
              <div className={styles.progressInfo}>
                <span>{currentAction}</span>
                <span>{progress}%</span>
              </div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {stats.pending === 0 && !isProcessing && (
            <p className={styles.statusText}>✨ Tudo certo! A inteligência artificial já conhece todos os rostos da galeria.</p>
          )}
        </div>

        <div className={styles.logs}>
          {logs.map((log, i) => (
            <div key={i} className={`${styles.logEntry} ${styles[`log${log.type.charAt(0).toUpperCase() + log.type.slice(1)}`]}`}>
              [{log.time}] {log.message}
            </div>
          ))}
          {logs.length === 0 && <p style={{ opacity: 0.3 }}>Nenhum log registrado ainda.</p>}
        </div>
      </main>
    </div>
  );
}
