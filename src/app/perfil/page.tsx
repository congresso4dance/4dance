"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { 
  User as UserIcon, 
  LogOut, 
  Camera, 
  Image as ImageIcon, 
  Settings, 
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { motion } from 'framer-motion';
import styles from './perfil.module.css';

export default function PerfilPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setProfile({ ...data, email: user.email });
      setLoading(false);
    }
    getProfile();
  }, [supabase, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className={styles.spinner}
        />
      </div>
    );
  }

  const isAdmin = profile?.role === 'PHOTOGRAPHER' || profile?.role === 'ADMIN' || profile?.email === 'agnaldomoita@gmail.com';

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <Link href="/" className={styles.backBtn}>
          <ArrowLeft size={20} />
          <span>Voltar para o site</span>
        </Link>
      </div>

      <main className={styles.content}>
        <motion.div 
          className={styles.profileCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={styles.avatarLarge}>
            {profile?.full_name?.charAt(0).toUpperCase() || <UserIcon size={40} />}
          </div>
          
          <div className={styles.userInfo}>
            <h1>{profile?.full_name || 'Usuário'}</h1>
            <p>{profile?.email}</p>
            <span className={styles.roleBadge}>
              {isAdmin ? 'Acesso Total' : 'Dançarino(a)'}
            </span>
          </div>
        </motion.div>

        <div className={styles.menuGrid}>
          <Link href="/minhas-fotos" className={styles.menuItem}>
            <div className={styles.itemIcon} style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED' }}>
              <ImageIcon size={24} />
            </div>
            <div className={styles.itemText}>
              <h3>Minhas Fotos</h3>
              <p>Veja e baixe suas fotos dos eventos</p>
            </div>
            <ChevronRight size={20} className={styles.arrow} />
          </Link>

          {isAdmin && (
            <Link href="/portal-fotografo" className={styles.menuItem}>
              <div className={styles.itemIcon} style={{ background: 'rgba(225, 29, 72, 0.1)', color: '#E11D48' }}>
                <Camera size={24} />
              </div>
              <div className={styles.itemText}>
                <h3>Área do Fotógrafo</h3>
                <p>Gerencie seus eventos e fotos</p>
              </div>
              <ChevronRight size={20} className={styles.arrow} />
            </Link>
          )}

          <Link href="/portal-fotografo/configuracoes" className={styles.menuItem}>
            <div className={styles.itemIcon} style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#fff' }}>
              <Settings size={24} />
            </div>
            <div className={styles.itemText}>
              <h3>Configurações</h3>
              <p>Ajuste seu perfil e preferências</p>
            </div>
            <ChevronRight size={20} className={styles.arrow} />
          </Link>

          <button onClick={handleLogout} className={styles.logoutItem}>
            <div className={styles.itemIcon} style={{ background: 'rgba(255, 68, 68, 0.1)', color: '#ff4444' }}>
              <LogOut size={24} />
            </div>
            <div className={styles.itemText}>
              <h3>Sair da Conta</h3>
              <p>Desconectar-se do 4Dance</p>
            </div>
            <ChevronRight size={20} className={styles.arrow} />
          </button>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>© 2024 4Dance. Fotografia de Dança Premium.</p>
      </footer>
    </div>
  );
}
