"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Settings, Save, Shield, Brain, Zap, Bell, CheckCircle2 } from 'lucide-react';
import styles from '../dashboard.module.css';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>({
    match_threshold: 0.92,
    gemini_enabled: true,
    max_search_results: 100,
    notify_on_new_lead: true
  });
  const [toast, setToast] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function fetchSettings() {
      const { data } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', 'ai_config')
        .single();
      
      if (data) {
        setSettings(data.value);
      }
      setLoading(false);
    }
    fetchSettings();
  }, [supabase]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('system_settings')
      .upsert({ 
        key: 'ai_config', 
        value: settings,
        updated_at: new Date().toISOString()
      });

    if (!error) {
      setToast(true);
      setTimeout(() => setToast(false), 3000);
    } else {
      alert("Erro ao salvar configurações: " + error.message);
    }
    setSaving(false);
  };

  if (loading) return <div className={styles.container}>Carregando configurações...</div>;

  return (
    <div className={styles.container}>
      {toast && (
        <div style={{ position: 'fixed', top: '2rem', right: '2rem', background: '#10b981', color: 'black', padding: '1rem 2rem', borderRadius: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.75rem', zIndex: 1000, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
          <CheckCircle2 size={20} /> Configurações Salvas!
        </div>
      )}

      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Settings size={32} color="var(--primary)" />
          <div>
            <h1 className={styles.title}>Configurações Globais</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)' }}>Ajuste fino do motor de IA e comportamento do sistema.</p>
          </div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', marginTop: '3rem' }}>
        
        {/* IA Calibration */}
        <section style={{ background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.1rem', marginBottom: '1.5rem', color: '#3b82f6' }}>
            <Brain size={20} /> Calibragem de IA
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className={styles.inputGroup}>
              <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                Sensibilidade da Face (Threshold)
                <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{settings.match_threshold}</span>
              </label>
              <input 
                type="range" 
                min="0.5" 
                max="0.99" 
                step="0.01" 
                value={settings.match_threshold}
                onChange={(e) => setSettings({ ...settings, match_threshold: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--primary)' }}
              />
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.5rem' }}>
                Aumente para ser mais rigoroso (0.92 é o modo Elite recomendado).
              </p>
            </div>

            <div className={styles.inputGroup} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={settings.gemini_enabled}
                  onChange={(e) => setSettings({ ...settings, gemini_enabled: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                />
                Verificação de 2º Passo (Gemini IA)
              </label>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.5rem', marginLeft: '1.6rem' }}>
                Usa IA generativa para confirmar faces. Requer cota na Google API.
              </p>
            </div>
          </div>
        </section>

        {/* Engine Limits */}
        <section style={{ background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.1rem', marginBottom: '1.5rem', color: '#f59e0b' }}>
            <Zap size={20} /> Performance & Limites
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className={styles.inputGroup}>
              <label>Máximo de Fotos por Busca</label>
              <input 
                type="number" 
                value={settings.max_search_results}
                onChange={(e) => setSettings({ ...settings, max_search_results: parseInt(e.target.value) })}
                style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.8rem', borderRadius: '8px', width: '100%' }}
              />
            </div>

            <div className={styles.inputGroup} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={settings.notify_on_new_lead}
                  onChange={(e) => setSettings({ ...settings, notify_on_new_lead: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                />
                Notificação de Leads
              </label>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.5rem', marginLeft: '1.6rem' }}>
                Alerte no navegador quando um novo cliente for capturado.
              </p>
            </div>
          </div>
        </section>

      </div>

      <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
        <button 
          className={styles.submitBtn} 
          onClick={handleSave} 
          disabled={saving}
          style={{ width: 'auto', padding: '1rem 3rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
        >
          {saving ? 'Salvando...' : <><Save size={20} /> Salvar Configurações</>}
        </button>
      </div>

      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', padding: '1.5rem', background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '16px' }}>
        <Shield size={20} color="#3b82f6" />
        <p style={{ fontSize: '0.85rem', color: '#c0d4f1' }}>
          <strong>Dica Pro:</strong> Se estiver recebendo muitas fotos de outras pessoas, aumente o threshold para 0.95. Se não estiver encontrando fotos reais, abaixe para 0.88.
        </p>
      </div>
    </div>
  );
}
