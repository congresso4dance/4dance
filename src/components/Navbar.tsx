"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, User as UserIcon, LayoutGrid, ShoppingBag, Settings, LogOut, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = useRef(createClient()).current;
  const router = useRouter();
  const { scrollY } = useScroll();

  useEffect(() => {
    async function loadProfile(authUser: any) {
      if (!authUser) { setUser(null); setProfile(null); return; }
      setUser(authUser);
      const { data } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', authUser.id)
        .single();
      setProfile(data ?? null);
    }

    // getSession lê do cache local sem chamada de rede - mais confiável
    supabase.auth.getSession().then(({ data: { session } }) => {
      loadProfile(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      loadProfile(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50);
  });

  const handleLogout = async () => {
    setDropdownOpen(false);
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    router.push('/');
    router.refresh();
  };

  const menuLinks = [
    { href: "/", label: "Home" },
    { href: "/eventos", label: "Galeria" },
    { href: "/sobre", label: "Sobre" },
    { href: "/contrate", label: "Contrate", isCTA: true },
  ];

  const initial = profile?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?';

  return (
    <nav className={`${styles.navbar} ${isScrolled ? styles.scrolled : ''}`}>
      <motion.div
        className={styles.container}
        initial={false}
        animate={{
          width: isScrolled ? '90%' : '100%',
          maxWidth: isScrolled ? '800px' : 'var(--container-max)',
          marginTop: isScrolled ? '1.5rem' : '0',
          borderRadius: isScrolled ? '100px' : '0',
          background: isScrolled ? 'rgba(15, 15, 15, 0.7)' : 'rgba(5, 5, 5, 0)',
          boxShadow: isScrolled ? '0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08)' : 'none',
        }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <Link href="/" className={styles.logo}>
          <motion.div animate={{ scale: isScrolled ? 0.85 : 1 }} transition={{ duration: 0.4 }}>
            <Image
              src="/logo/Logo l 4dance_BRANCA.png"
              alt="4Dance Logo"
              width={140}
              height={40}
              priority
              style={{ width: 'auto', height: '32px', objectFit: 'contain' }}
            />
          </motion.div>
        </Link>

        <ul
          className={styles.links}
          style={{
            '--nav-gap': isScrolled ? '1.5rem' : '3rem',
            paddingLeft: isScrolled ? '1rem' : '0'
          } as any}
        >
          {menuLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className={link.isCTA ? styles.cta : ''}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className={styles.userSection}>
          {user ? (
            <div className={styles.accountArea} ref={dropdownRef}>
              <button
                className={styles.avatarBtn}
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-label="Minha conta"
              >
                <div className={styles.avatar}>{initial}</div>
                <span className={styles.avatarName}>
                  {profile?.full_name?.split(' ')[0] || 'Minha Conta'}
                </span>
                <ChevronDown size={14} className={dropdownOpen ? styles.chevronUp : ''} />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    className={styles.dropdown}
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className={styles.dropdownHeader}>
                      <span>{profile?.full_name || user.email}</span>
                      <small>Área do Cliente</small>
                    </div>

                    <div className={styles.dropdownLinks}>
                      <Link href="/minha-conta" onClick={() => setDropdownOpen(false)}>
                        <LayoutGrid size={16} /> Minha Conta
                      </Link>
                      <Link href="/minhas-fotos" onClick={() => setDropdownOpen(false)}>
                        <UserIcon size={16} /> Minhas Fotos
                      </Link>
                      <Link href="/meus-pedidos" onClick={() => setDropdownOpen(false)}>
                        <ShoppingBag size={16} /> Minhas Compras
                      </Link>
                      <Link href="/minha-conta/configuracoes" onClick={() => setDropdownOpen(false)}>
                        <Settings size={16} /> Configurações
                      </Link>
                    </div>

                    <button className={styles.dropdownLogout} onClick={handleLogout}>
                      <LogOut size={16} /> Sair da conta
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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
              {user && (
                <li>
                  <Link href="/minha-conta" onClick={() => setIsOpen(false)} className={styles.mobileCta}>
                    Minha Conta
                  </Link>
                </li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
