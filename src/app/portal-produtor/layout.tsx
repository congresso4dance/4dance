"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  PlusCircle,
  LogOut,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import styles from './portal-produtor.module.css';

type ProducerProfile = {
  full_name?: string | null;
  role?: string | null;
  email?: string | null;
};

export default function ProducerLayout({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<ProducerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, role, email')
        .eq('id', user.id)
        .single();

      const role = profileData?.role?.toLowerCase();
      if (!profileData || !['producer', 'admin', 'owner'].includes(role || '')) {
        router.push('/');
        return;
      }

      setProfile(profileData);
      setLoading(false);
    }
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) return <div className={styles.loading}>Carregando portal...</div>;

  const menuItems = [
    { label: 'Painel Geral', icon: LayoutDashboard, href: '/portal-produtor' },
    { label: 'Criar Evento', icon: PlusCircle, href: '/portal-produtor/novo-evento' },
  ];

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logoBadge}>4D</div>
          <h2>Painel do Produtor</h2>
        </div>

        <nav className={styles.nav}>
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navLink} ${pathname === item.href ? styles.active : ''}`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
              <ChevronRight size={14} className={styles.chevron} />
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link href="/" className={styles.externalLink}>
            <ExternalLink size={16} />
            <span>Ver Site Público</span>
          </Link>

          <div className={styles.userProfile}>
            <div className={styles.avatar}>
              {profile?.full_name?.charAt(0).toUpperCase() || 'P'}
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{profile?.full_name}</span>
              <span className={styles.userRole}>Produtor</span>
            </div>
          </div>

          <button onClick={handleLogout} className={styles.logoutBtn}>
            <LogOut size={16} />
            <span>Sair da conta</span>
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}
