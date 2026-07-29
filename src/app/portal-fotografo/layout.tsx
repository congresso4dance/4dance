"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Camera,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
  Share2,
  LayoutDashboard,
  PlusCircle,
  Users,
  Globe,
  ExternalLink
} from 'lucide-react';
import styles from './fotografo.module.css';

export default function PhotographerLayout({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<any>(null);
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

      const { data: profile } = await supabase
        .from('profiles')
        .select('*, stripe_account_id, email')
        .eq('id', user.id)
        .single();

      const role = profile?.role?.toLowerCase();
      if (!profile || !['photographer', 'admin', 'owner'].includes(role || '')) {
        router.push('/');
        return;
      }

      setProfile(profile);
      setLoading(false);
    }
    checkAuth();
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) return <div className={styles.loading}>Carregando portal...</div>;

  const menuItems = [
    { label: 'Painel Geral', icon: LayoutDashboard, href: '/portal-fotografo' },
    { label: 'Meus Eventos', icon: Camera, href: '/portal-fotografo/eventos' },
    { label: 'Criar Evento', icon: PlusCircle, href: '/portal-fotografo/eventos/novo' },
    { label: 'Oportunidades', icon: Users, href: '/portal-fotografo/oportunidades' },
    { label: 'Estatísticas de uso', icon: BarChart3, href: '/portal-fotografo/estatisticas' },
    { label: 'Artes de divulgação', icon: Share2, href: '/portal-fotografo/divulgacao' },
    { label: 'Meu Site', icon: Globe, href: '/portal-fotografo/site' },
    { label: 'Configurações', icon: Settings, href: '/portal-fotografo/configuracoes' },
  ];

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logoBadge}>4D</div>
          <h2>Painel do Fotógrafo</h2>
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
          <a
            href="https://wa.me/55?text=Ol%C3%A1%2C+quero+fazer+upgrade+do+meu+plano+no+4Dance!"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.upgradeBtn}
          >
            Fazer upgrade
          </a>

          <Link href="/" className={styles.externalLink}>
            <ExternalLink size={16} />
            <span>Ver Site Público</span>
          </Link>

          <div className={styles.userProfile}>
            <div className={styles.avatar}>
              {profile?.full_name?.charAt(0).toUpperCase() || 'F'}
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{profile?.full_name}</span>
              <span className={styles.userRole}>Plano Pro • Taxa: {profile?.custom_rate ? `${profile.custom_rate}%` : '10%'}</span>
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
