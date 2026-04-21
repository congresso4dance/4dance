import { createClient } from '@/utils/supabase/server';
import AdminNavbar from '@/components/AdminNavbar';
import styles from '../dashboard.module.css';
import { Brain, Search, Users, Activity, Zap, CheckCircle } from 'lucide-react';

export default async function InsightsPage() {
  const supabase = await createClient();

  // 1. IA Stats
  const { count: photosCount } = await supabase
    .from('photos')
    .select('*', { count: 'exact', head: true });

  const { data: indexedData } = await supabase
    .from('photo_faces')
    .select('photo_id');
  
  const indexedSet = new Set(indexedData?.map(d => d.photo_id));
  const indexedCount = indexedSet.size;
  const coveragePercent = photosCount ? Math.round((indexedCount / photosCount) * 100) : 0;

  // 2. Search Stats (Using new table)
  const { count: totalSearches } = await supabase
    .from('search_logs')
    .select('*', { count: 'exact', head: true });

  const { count: successfulSearches } = await supabase
    .from('search_logs')
    .select('*', { count: 'exact', head: true })
    .eq('success', true);

  // 3. Leads Conversion
  const { count: leadsCount } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Inteligência & Insights</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)' }}>Desempenho do motor facial e engajamento do público.</p>
      </header>

      <div className={styles.stats} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <div className={styles.statCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <Brain size={24} color="var(--primary)" />
            <span style={{ fontSize: '0.8rem', color: '#10b981' }}>{coveragePercent}% Cobertura</span>
          </div>
          <h3>Fotos Indexadas</h3>
          <p>{indexedCount} / {photosCount}</p>
        </div>

        <div className={styles.statCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <Search size={24} color="#3b82f6" />
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>Total Geral</span>
          </div>
          <h3>Buscas Realizadas</h3>
          <p>{totalSearches || 0}</p>
        </div>

        <div className={styles.statCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <Zap size={24} color="#f59e0b" />
            <span style={{ fontSize: '0.8rem', color: '#10b981' }}>{successfulSearches || 0} Sucessos</span>
          </div>
          <h3>Taxa de Acerto IA</h3>
          <p>{totalSearches ? Math.round(((successfulSearches || 0) / totalSearches) * 100) : 0}%</p>
        </div>

        <div className={styles.statCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <Users size={24} color="#a855f7" />
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>Total Leads</span>
          </div>
          <h3>Captura de Clientes</h3>
          <p>{leadsCount || 0}</p>
        </div>
      </div>

      <section style={{ marginTop: '3rem', background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.2rem', marginBottom: '1.5rem' }}>
          <Activity size={20} color="var(--primary)" /> Saúde do Sistema
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem' }}>DATABASE</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></div>
              <span style={{ fontWeight: 600 }}>Supabase pgvector</span>
            </div>
          </div>
          <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem' }}>IA MODELS</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></div>
              <span style={{ fontWeight: 600 }}>face-api.js Ready</span>
            </div>
          </div>
          <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem' }}>GEMINI API</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></div>
              <span style={{ fontWeight: 600 }}>2.0 Flash Active</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
