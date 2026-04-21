import { createClient } from '@/utils/supabase/server';
import styles from '../dashboard.module.css';
import { ShieldCheck, History, Info, AlertTriangle } from 'lucide-react';

export default async function LogsPage() {
  const supabase = await createClient();

  // Fetch admin logs
  const { data: logs } = await supabase
    .from('admin_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <ShieldCheck size={32} color="var(--primary)" />
          <div>
            <h1 className={styles.title}>Segurança & Auditoria</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)' }}>Rastro de ações administrativas e alterações no sistema.</p>
          </div>
        </div>
      </header>

      <section className={styles.leadsSection} style={{ marginTop: '2rem' }}>
        <div className={styles.sectionHeader}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History size={20} /> Histórico Recente
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>Últimas 50 ações</span>
        </div>

        <div className={styles.leadsTable}>
          <div className={styles.tableHeader} style={{ gridTemplateColumns: '150px 180px 1fr 180px' }}>
            <span>Ação</span>
            <span>Admin</span>
            <span>Detalhes / Título</span>
            <span>Data</span>
          </div>
          
          {logs?.map((log) => (
            <div key={log.id} className={styles.tableRow} style={{ gridTemplateColumns: '150px 180px 1fr 180px' }}>
              <span style={{ 
                fontWeight: 600, 
                fontSize: '0.75rem',
                color: log.action.includes('DELETE') ? '#ff2d55' : '#3b82f6',
                background: log.action.includes('DELETE') ? 'rgba(255,45,85,0.1)' : 'rgba(59,130,246,0.1)',
                padding: '2px 8px',
                borderRadius: '4px',
                textAlign: 'center'
              }}>
                {log.action}
              </span>
              <span className={styles.leadName} style={{ fontSize: '0.85rem' }}>{log.admin_email}</span>
              <span style={{ opacity: 0.8, fontSize: '0.85rem' }}>
                {log.details?.title || log.details?.name || log.details?.message || '---'}
              </span>
              <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>
                {new Date(log.created_at).toLocaleString('pt-BR')}
              </span>
            </div>
          ))}

          {(!logs || logs.length === 0) && (
            <div style={{ padding: '4rem', textAlign: 'center', opacity: 0.5 }}>
              <Info size={48} style={{ margin: '0 auto 1rem' }} />
              <p>Nenhum log de auditoria registrado ainda.</p>
            </div>
          )}
        </div>
      </section>

      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', padding: '1rem', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px' }}>
        <AlertTriangle size={20} color="#f59e0b" />
        <p style={{ fontSize: '0.85rem', color: '#f59e0b' }}>
          <strong>Nota de Segurança:</strong> Este log é permanente e não pode ser editado. Todas as exclusões de fotos e eventos são rastreadas para evitar perda acidental de dados.
        </p>
      </div>
    </div>
  );
}
