"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import styles from './Navbar.module.css';

import { User as UserIcon, LogOut, Camera, Image as ImageIcon, Settings, ChevronRight } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const supabase = createClient();
  const { scrollY } = useScroll();

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(data);
      }
    }
    getProfile();
  }, [supabase]);

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 50) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }
  });

  const menuLinks = [
    { href: "/", label: "Home" },
    { href: "/eventos", label: "Galeria" },
    { href: "/sobre", label: "Sobre" },
    { href: "/contrate", label: "Contrate", isCTA: true },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <nav className={`${styles.navbar} ${isScrolled ? styles.scrolled : ''}`}>
      <motion.div 
        className={styles.container}
        initial={false}
        animate={{
          width: isScrolled ? '90%' : '100%',
          maxWidth: isScrolled ? '600px' : 'var(--container-max)',
          paddingLeft: isScrolled ? '2rem' : '2rem',
          paddingRight: isScrolled ? '1.5rem' : '2rem',
          marginTop: isScrolled ? '1.5rem' : '0',
          borderRadius: isScrolled ? '100px' : '0',
          background: isScrolled ? 'rgba(15, 15, 15, 0.7)' : 'rgba(5, 5, 5, 0)',
          boxShadow: isScrolled ? '0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08)' : 'none',
        }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <Link href="/" className={styles.logo}>
          <motion.div
            animate={{ scale: isScrolled ? 0.85 : 1 }}
            transition={{ duration: 0.4 }}
          >
            <Image 
              src="/logo/Logo l 4dance_BRANCA.png" 
              alt="4Dance Logo" 
              width={120} 
              height={40} 
              priority
            />
          </motion.div>
        </Link>

        {/* Desktop Links */}
        <ul className={styles.links}>
          {menuLinks.map((link) => (
            <li key={link.href}>
              <Link 
                href={link.href} 
                className={link.isCTA ? styles.cta : ''}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* User Profile / Login */}
        <div className={styles.userSection}>
          {profile ? (
            <button 
              className={styles.avatarBtn}
              onClick={() => setIsUserMenuOpen(true)}
            >
              <div className={styles.avatar}>
                {profile.full_name?.charAt(0).toUpperCase() || <UserIcon size={20} />}
              </div>
            </button>
          ) : (
            <Link href="/login" className={styles.loginBtn}>Entrar</Link>
          )}

          <button 
            className={styles.mobileToggle} 
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Menu"
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </motion.div>

      {/* User Menu Drawer (The "Chic" Style) */}
      <AnimatePresence>
        {isUserMenuOpen && (
          <>
            <motion.div 
              className={styles.menuOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUserMenuOpen(false)}
            />
            <motion.div 
              className={styles.userDrawer}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <div className={styles.drawerHeader}>
                <button onClick={() => setIsUserMenuOpen(false)} className={styles.closeDrawer}>
                  <X size={24} />
                </button>
                <div className={styles.drawerUserInfo}>
                  <h3>{profile?.full_name || 'Usuário'}</h3>
                  <p>{profile?.email}</p>
                  <span className={styles.planBadge}>
                    {profile?.role === 'PHOTOGRAPHER' || profile?.role === 'ADMIN' ? 'Plano Pro' : 'Cliente'}
                  </span>
                </div>
              </div>

              <div className={styles.drawerContent}>
                <Link href="/minhas-fotos" className={styles.drawerItem} onClick={() => setIsUserMenuOpen(false)}>
                  <div className={styles.drawerItemLabel}>
                    <ImageIcon size={20} />
                    <span>Minhas Fotos</span>
                  </div>
                  <ChevronRight size={18} />
                </Link>

                {(profile?.role === 'PHOTOGRAPHER' || profile?.role === 'ADMIN') && (
                  <Link href="/portal-fotografo" className={styles.drawerItem} onClick={() => setIsUserMenuOpen(false)}>
                    <div className={styles.drawerItemLabel}>
                      <Camera size={20} />
                      <span>Área do Fotógrafo</span>
                    </div>
                    <ChevronRight size={18} />
                  </Link>
                )}

                <Link href="/portal-fotografo/configuracoes" className={styles.drawerItem} onClick={() => setIsUserMenuOpen(false)}>
                  <div className={styles.drawerItemLabel}>
                    <Settings size={20} />
                    <span>Configurações</span>
                  </div>
                  <ChevronRight size={18} />
                </Link>
              </div>

              <div className={styles.drawerFooter}>
                <button onClick={handleLogout} className={styles.logoutBtn}>
                  <LogOut size={20} />
                  Sair da conta
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className={styles.mobileMenu}
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <ul className={styles.mobileLinks}>
              {menuLinks.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    onClick={() => setIsOpen(false)}
                    className={link.isCTA ? styles.mobileCta : ''}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
