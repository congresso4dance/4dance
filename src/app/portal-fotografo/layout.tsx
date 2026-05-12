"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  User, 
  Wallet, 
  Camera, 
  BarChart3, 
  Settings, 
  LogOut, 
  ChevronRight,
  Globe,
  Share2,
  LayoutDashboard
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
    { label: 'Estatísticas de uso', icon: BarChart3, href: '/portal-fotografo/estatisticas' },
    { label: 'Artes de divulgação', icon: Share2, href: '/portal-fotografo/divulgacao' },
    { label: 'Meu site', icon: Globe, href: '/portal-fotografo/site' },
    { label: 'Configurações', icon: Settings, href: '/portal-fotografo/configuracoes' },
  ];

  return (
    <div className={styles.container}>
      {/* Mobile Header / User Info */}
      <header className={styles.userHeader}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>
            {profile?.full_name?.charAt(0).toUpperCase() || 'F'}
          </div>
          <div>
            <h2 className={styles.userName}>{profile?.full_name}</h2>
            <p className={styles.userRole}>Plano Pro • Taxa: {profile?.custom_rate ? `${profile.custom_rate}%` : '10%'}</p>
          </div>
        </div>
        <a
          href="https://wa.me/55?text=Ol%C3%A1%2C+quero+fazer+upgrade+do+meu+plano+no+4Dance!"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.upgradeBtn}
        >
          Fazer upgrade
        </a>
      </header>

      <main className={styles.mainContent}>
        {children}
      </main>

      {/* Navigation Menu (The "Chic" List Style) */}
      <nav className={styles.navMenu}>
        <div className={styles.menuSection}>
          {menuItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href} 
              className={`${styles.menuItem} ${pathname === item.href ? styles.active : ''}`}
            >
              <div className={styles.menuItemLabel}>
                <item.icon size={20} className={styles.menuIcon} />
                <span>{item.label}</span>
              </div>
              <ChevronRight size={18} className={styles.chevron} />
            </Link>
          ))}
        </div>

        <button onClick={handleLogout} className={styles.logoutBtn}>
          Sair da conta
        </button>
      </nav>
    </div>
  );
}
