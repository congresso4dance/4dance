import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import styles from './admin.module.css';
import { 
  LayoutDashboard, 
  Settings, 
  Calendar, 
  BrainCircuit, 
  ShieldCheck, 
  ChevronRight,
  ExternalLink,
  LogOut,
  Upload
} from 'lucide-react';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logoBadge}>4D</div>
          <h2>4Dance Admin</h2>
        </div>
        
        <nav className={styles.nav}>
          <div className={styles.navGroup}>
            <span className={styles.groupLabel}>GERAL</span>
            <Link href="/admin" className={styles.navLink}>
              <LayoutDashboard size={20} />
              <span>Painel</span>
              <ChevronRight size={14} className={styles.chevron} />
            </Link>
            <Link href="/admin/importer" className={styles.navLink}>
              <Upload size={20} />
              <span>Importador</span>
              <ChevronRight size={14} className={styles.chevron} />
            </Link>
          </div>

          <div className={styles.navGroup}>
            <span className={styles.groupLabel}>INTELIGÊNCIA</span>
            <Link href="/admin/insights" className={styles.navLink}>
              <BrainCircuit size={20} />
              <span>Insights & IA</span>
              <ChevronRight size={14} className={styles.chevron} />
            </Link>
            <Link href="/admin/logs" className={styles.navLink}>
              <ShieldCheck size={20} />
              <span>Segurança & Logs</span>
              <ChevronRight size={14} className={styles.chevron} />
            </Link>
          </div>

          <div className={styles.navGroup}>
            <span className={styles.groupLabel}>SISTEMA</span>
            <Link href="/admin/settings" className={styles.navLink}>
              <Settings size={20} />
              <span>Configurações</span>
              <ChevronRight size={14} className={styles.chevron} />
            </Link>
          </div>
        </nav>

        <div className={styles.sidebarFooter}>
          <Link href="/" className={styles.externalLink}>
            <ExternalLink size={16} /> 
            <span>Ver Site Público</span>
          </Link>
          <div className={styles.userProfile}>
            <div className={styles.avatar}>{user.email?.charAt(0).toUpperCase()}</div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>Admin</span>
              <span className={styles.userEmail}>{user.email}</span>
            </div>
          </div>
        </div>
      </aside>
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}

