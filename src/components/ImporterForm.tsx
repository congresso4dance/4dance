"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import styles from "./importer.module.css";

interface Event {
  id: string;
  title: string;
  slug: string;
}

export default function ImporterForm({ events }: { events: Event[] }) {
  const [selectedEventId, setSelectedEventId] = useState("");
  const [urlsText, setUrlsText] = useState("");
  const [isIterating, setIsIterating] = useState(false);
  const [status, setStatus] = useState({ current: 0, total: 0, success: 0, error: 0 });

  const supabase = createClient();

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || !urlsText.trim()) {
      alert("Por favor, selecione um evento e insira as URLs.");
      return;
    }

    const urls = urlsText
      .split(/[\n,;]/)
      .map((url) => url.trim())
      .filter((url) => url.startsWith("http") && (url.includes("fbcdn") || url.includes("fbcontent") || url.includes("images") || url.includes("scontent")));

    if (urls.length === 0) {
      alert("Nenhuma URL válida encontrada. Certifique-se de colar os links das imagens.");
      return;
    }

    setIsIterating(true);
    setStatus({ current: 0, total: urls.length, success: 0, error: 0 });

    // Insert in batches of 10 for safety
    const batchSize = 20;
    for (let i = 0; i < urls.length; i += batchSize) {
      const currentBatch = urls.slice(i, i + batchSize);
      
      const payload = currentBatch.map(url => ({
        event_id: selectedEventId,
        full_res_url: url,
        thumbnail_url: url, // For Facebook, we use the same URL for both
        is_featured: false
      }));

      const { error } = await supabase.from('photos').insert(payload);

      if (error) {
        console.error("Batch error:", error);
        setStatus(prev => ({ ...prev, current: prev.current + currentBatch.length, error: prev.error + currentBatch.length }));
      } else {
        setStatus(prev => ({ ...prev, current: prev.current + currentBatch.length, success: prev.success + currentBatch.length }));
      }
    }

    setIsIterating(false);
    setUrlsText("");
    alert("Importação concluída!");
  };

  return (
    <form className={styles.form} onSubmit={handleImport}>
      <div className={styles.field}>
        <label>1. Para qual evento são essas fotos?</label>
        <select 
          value={selectedEventId} 
          onChange={(e) => setSelectedEventId(e.target.value)}
          required
        >
          <option value="">Selecione um evento...</option>
          {events.map(event => (
            <option key={event.id} value={event.id}>{event.title}</option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label>2. Cole os links das imagens (um por linha)</label>
        <textarea 
          placeholder="https://scontent.fgru..." 
          value={urlsText}
          onChange={(e) => setUrlsText(e.target.value)}
          rows={15}
          required
        />
      </div>

      {isIterating && (
        <div className={styles.progressOverlay}>
          <div className={styles.progressCard}>
            <h3>Processando Importação...</h3>
            <div className={styles.progressStats}>
              <span>Total: {status.total}</span>
              <span className={styles.success}>Sucesso: {status.success}</span>
              <span className={styles.error}>Erros: {status.error}</span>
            </div>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${(status.current / status.total) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <button 
        type="submit" 
        className={styles.submitBtn}
        disabled={isIterating}
      >
        {isIterating ? "Importando..." : `🚀 Importar ${urlsText.split('\n').filter(l => l.trim()).length} fotos`}
      </button>
    </form>
  );
}
