import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import styles from './dashboard.module.css';
import ExportLeadsBtn from '@/components/ExportLeadsBtn';
import AdminNavbar from '@/components/AdminNavbar';
import { Brain, Search, Target, Activity, Clock, ChevronRight, Eye, Edit3, Image as ImageIcon } from 'lucide-react';

export default async function AdminDashboard() {
  const supabase = await createClient();

  // 1. Fetch Events
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: false });

  // 2. Fetch Total Photos Count
  const { count: photosCount } = await supabase
    .from('photos')
    .select('*', { count: 'exact', head: true });

  // 3. Fetch Recent Testimonials
  const { count: testimonalsCount } = await supabase
    .from('testimonials')
    .select('*', { count: 'exact', head: true });

  // 4. Fetch Search Stats (New)
  const { count: totalSearches } = await supabase
    .from('search_logs')
    .select('*', { count: 'exact', head: true });

  const { count: successSearches } = await supabase
    .from('search_logs')
    .select('*', { count: 'exact', head: true })
    .eq('success', true);

  // 5. Fetch Activity Logs (New)
  const { data: recentLogs } = await supabase
    .from('admin_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  // 6. Fetch Leads
  const { data: recentLeads, count: leadsCount } = await supabase
    .from('leads')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(10);

  const { data: allLeads } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className={styles.container}>
      <AdminNavbar active="dashboard" />
      
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.title}>Dashboard</h1>
          <div className={styles.systemStatus}>
            <div className={styles.statusItem}>
              <span className={styles.statusDot} style={{ background: events ? '#10b981' : '#ef4444' }}></span>
              Banco: {events ? 'Conectado' : 'Erro de Conexão'}
            </div>
            <div className={styles.statusItem}>
              <span className={styles.statusDot} style={{ background: recentLeads !== undefined ? '#10b981' : '#f59e0b' }}></span>
              Leads: {recentLeads !== undefined ? 'Captura Ativa' : 'Aguardando SQL'}
            </div>
          </div>
        </div>
      </header>

      <section className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><Search size={20} color="#3b82f6" /></div>
          <h3>Buscas Realizadas</h3>
          <p>{totalSearches || 0}</p>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><Target size={20} color="#10b981" /></div>
          <h3>Acerto de IA</h3>
          <p>{totalSearches ? Math.round(((successSearches || 0) / totalSearches) * 100) : 0}%</p>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><Brain size={20} color="var(--primary)" /></div>
          <h3>Fotos Indexadas</h3>
          <p>{photosCount || 0}</p>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><Activity size={20} color="#a855f7" /></div>
          <h3>Total de Leads</h3>
          <p>{leadsCount || 0}</p>
        </div>
      </section>

      <div className={styles.adminGridSplit}>
        <section className={styles.leadsSection}>
          <div className={styles.sectionHeader}>
            <h2>Leads Recentes</h2>
            <ExportLeadsBtn leads={allLeads || []} />
          </div>
          <div className={styles.leadsTable}>
            <div className={styles.tableHeader}>
              <span>Nome</span>
              <span>WhatsApp</span>
              <span>Data</span>
            </div>
            {recentLeads?.map((lead) => (
              <div key={lead.id} className={styles.tableRow}>
                <span className={styles.leadName}>{lead.name}</span>
                <span>{lead.whatsapp}</span>
                <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>{new Date(lead.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
            ))}
            {(!recentLeads || recentLeads.length === 0) && (
              <p className={styles.empty}>Aguardando captação.</p>
            )}
          </div>
        </section>

        <section className={styles.activitySection}>
          <div className={styles.sectionHeader}>
            <h2>Atividade Log Elite</h2>
            <Link href="/admin/logs" className={styles.seeMore}>Ver todos <ChevronRight size={14}/></Link>
          </div>
          <div className={styles.logsList}>
            {recentLogs?.map((log) => (
              <div key={log.id} className={styles.logItem}>
                <div className={styles.logMeta}>
                  <Clock size={12} />
                  <span>{new Date(log.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className={styles.logContent}>
                  <strong>{log.action}</strong>
                  <span>{log.details?.title || log.details?.subtitle || 'Alteração de sistema'}</span>
                </div>
              </div>
            ))}
            {(!recentLogs || recentLogs.length === 0) && (
              <p className={styles.empty}>Nenhuma atividade registrada.</p>
            )}
          </div>
        </section>
      </div>

      <section className={styles.eventsList}>
        <h2>Gerenciar Conteúdo</h2>
        <div className={styles.grid}>
          {events?.map((event) => (
            <div key={event.id} className={styles.eventCard}>
              <div className={styles.eventInfo}>
                <div className={styles.badge}>{event.is_public ? 'Público' : 'Privado'}</div>
                <h3>{event.title}</h3>
                <span>{new Date(event.event_date).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className={styles.eventActions}>
                <Link href={`/eventos/${event.slug}`} target="_blank" className={styles.viewBtn}>
                  <Eye size={16} /> Ver
                </Link>
                <Link href={`/admin/events/${event.id}`} className={styles.editBtn}>
                  <Edit3 size={16} /> Editar / <ImageIcon size={16} /> Fotos
                </Link>
              </div>
            </div>
          ))}
          {(!events || events.length === 0) && (
            <p className={styles.empty}>Nenhum evento criado ainda.</p>
          )}
        </div>
      </section>
    </div>
  );
}
