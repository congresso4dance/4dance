import { createClient } from '@/utils/supabase/server';
import AdminNavbar from '@/components/AdminNavbar';
import styles from '../dashboard.module.css';
import { Search, Filter, Calendar, Activity, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

export default async function AdminSearchesPage() {
  const supabase = await createClient();

  // Fetch search logs with event details
  const { data: logs } = await supabase
    .from('search_logs')
    .select(`
      *,
      events (
        title
      )
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  // Calculate metrics
  const total = logs?.length || 0;
  const successCount = logs?.filter(l => l.success).length || 0;
  const avgResults = total > 0 ? logs!.reduce((acc, curr) => acc + (curr.results_count || 0), 0) / total : 0;

  return (
    <div className={styles.container}>
      <AdminNavbar active="dashboard" />
      
      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Activity size={32} color="var(--primary)" />
          <div>
            <h1 className={styles.title}>Auditoria de Buscas</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)' }}>Monitore o desempenho do reconhecimento facial em tempo real.</p>
          </div>
        </div>
      </header>

      <section className={styles.stats} style={{ marginTop: '2rem' }}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><Activity size={20} color="#3b82f6" /></div>
          <h3>Total de Consultas</h3>
          <p>{total}</p>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><CheckCircle2 size={20} color="#10b981" /></div>
          <h3>Sucesso (Match)</h3>
          <p>{total > 0 ? Math.round((successCount / total) * 100) : 0}%</p>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><Search size={20} color="#f59e0b" /></div>
          <h3>Média de Fotos/Busca</h3>
          <p>{avgResults.toFixed(1)}</p>
        </div>
      </section>

      <section className={styles.leadsSection} style={{ marginTop: '3rem' }}>
        <div className={styles.sectionHeader}>
          <h2>Histórico Recente</h2>
        </div>
        <div className={styles.leadsTable}>
          <div className={styles.tableHeader} style={{ gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr' }}>
            <span>Status</span>
            <span>Evento</span>
            <span>Resultados</span>
            <span>Data</span>
            <span>Hora</span>
          </div>
          {logs?.map((log) => (
            <div key={log.id} className={styles.tableRow} style={{ gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr' }}>
              <span>
                {log.success ? 
                  <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '5px' }}><CheckCircle2 size={14}/> Sucesso</span> : 
                  <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '5px' }}><XCircle size={14}/> Sem Match</span>
                }
              </span>
              <span className={styles.leadName}>{log.events?.title || 'Busca Global'}</span>
              <span style={{ fontWeight: 700 }}>{log.results_count} fotos</span>
              <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>{new Date(log.created_at).toLocaleDateString('pt-BR')}</span>
              <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>{new Date(log.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          ))}
          {(!logs || logs.length === 0) && (
            <p className={styles.empty}>Nenhuma busca registrada ainda.</p>
          )}
        </div>
      </section>

      <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', textAlign: 'center' }}>
        <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)' }}>
          Para ajustar a precisão das buscas, vá em <Link href="/admin/settings" style={{ color: 'var(--primary)', fontWeight: 600 }}>Configurações Elite</Link>
        </p>
      </div>
    </div>
  );
}
