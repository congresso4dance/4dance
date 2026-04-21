import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import styles from './dashboard.module.css';
import ExportLeadsBtn from '@/components/ExportLeadsBtn';
import AdminNavbar from '@/components/AdminNavbar';

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

  // 4. Fetch Leads (Recent 10 for display)
  const { data: recentLeads, count: leadsCount } = await supabase
    .from('leads')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(10);

  // 5. Fetch All Leads for Export (Optional: can be optimized with a separate route if huge)
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
          <h3>Eventos</h3>
          <p>{events?.length || 0}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Total de Fotos</h3>
          <p>{photosCount || 0}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Depoimentos</h3>
          <p>{testimonalsCount || 0}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Leads (Clientes)</h3>
          <p>{leadsCount || 0}</p>
        </div>
      </section>

      <section className={styles.leadsSection}>
        <div className={styles.sectionHeader}>
          <h2>Leads Recentes (Captura de Contatos)</h2>
          <ExportLeadsBtn leads={allLeads || []} />
        </div>
        <div className={styles.leadsTable}>
          <div className={styles.tableHeader}>
            <span>Nome</span>
            <span>E-mail</span>
            <span>WhatsApp</span>
            <span>Data</span>
          </div>
          {recentLeads?.map((lead) => (
            <div key={lead.id} className={styles.tableRow}>
              <span className={styles.leadName}>{lead.name}</span>
              <span>{lead.email}</span>
              <span>{lead.whatsapp}</span>
              <span>{new Date(lead.created_at).toLocaleDateString('pt-BR')}</span>
            </div>
          ))}
          {(!recentLeads || recentLeads.length === 0) && (
            <p className={styles.empty}>Nenhum lead capturado ainda.</p>
          )}
        </div>
      </section>

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
                <Link href={`/eventos/${event.slug}`} target="_blank" className={styles.viewBtn}>Ver</Link>
                <Link href={`/admin/events/${event.id}`} className={styles.editBtn}>Editar / Fotos</Link>
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
