"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css'; // Reusing base navbar styles with overrides

export default function AdminNavbar({ active }: { active?: string }) {
  const pathname = usePathname();

  return (
    <nav className={styles.adminNav}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <Link href="/admin">4DANCE <span>PAINEL</span></Link>
        </div>
        
        <div className={styles.links}>
          <Link 
            href="/admin" 
            className={active === 'dashboard' ? styles.active : ''}
          >
            📊 Dashboard
          </Link>
          <Link 
            href="/admin/importer" 
            className={active === 'importer' ? styles.active : ''}
          >
            🚀 Importador
          </Link>
          <Link 
            href="/admin/events/new" 
            className={active === 'new' ? styles.active : ''}
          >
            ➕ Novo Evento
          </Link>
          <Link href="/" className={styles.backBtn}>
            🏠 Voltar ao Site
          </Link>
        </div>
      </div>
    </nav>
  );
}
