"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { LayoutGrid, ShoppingBag, Sparkles, LogOut, User, Settings, Home } from 'lucide-react';
import styles from './ClientSidebar.module.css';

type Profile = {
  full_name?: string | null;
};

type ClientSidebarProps = {
  profile: Profile | null;
  userEmail?: string | null;
};

export default function ClientSidebar({ profile, userEmail }: ClientSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const navLinks = [
    { href: '/minha-conta', label: 'Início', icon: <Home size={20} /> },
    { href: '/minhas-fotos', label: 'Minha Galeria', icon: <LayoutGrid size={20} /> },
    { href: '/meus-pedidos', label: 'Minhas Compras', icon: <ShoppingBag size={20} /> },
    { href: '/eventos', label: 'Descobrir Eventos', icon: <Sparkles size={20} /> },
    { href: '/minha-conta/configuracoes', label: 'Configurações', icon: <Settings size={20} /> },
  ];

  const displayName = profile?.full_name || userEmail || 'Dançarino';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <nav className={styles.sidebar}>
      <div className={styles.navTop}>
        <div className={styles.logo}>
          4DANCE <span>CLIENTE</span>
        </div>

        <Link href="/minha-conta" className={styles.userProfile}>
          <div className={styles.avatar}>{initial}</div>
          <div className={styles.userInfo}>
            <strong>{profile?.full_name || userEmail}</strong>
            <span>Área do Cliente</span>
          </div>
        </Link>
      </div>

      <div className={styles.navLinks}>
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={pathname === link.href ? styles.active : ''}
          >
            {link.icon}
            {link.label}
          </Link>
        ))}
      </div>

      <button onClick={handleLogout} className={styles.logoutBtn}>
        <LogOut size={20} /> Sair
      </button>
    </nav>
  );
}
