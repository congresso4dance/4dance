"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();

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

  return (
    <nav className={`${styles.navbar} ${isScrolled ? styles.scrolled : ''}`}>
      <motion.div 
        className={styles.container}
        initial={false}
        animate={{
          width: isScrolled ? '90%' : '100%',
          maxWidth: isScrolled ? '800px' : 'var(--container-max)',
          paddingLeft: isScrolled ? '1.5rem' : '2rem',
          paddingRight: isScrolled ? '1rem' : '2rem',
          marginTop: isScrolled ? '1rem' : '0',
          borderRadius: isScrolled ? '50px' : '0',
          background: isScrolled ? 'rgba(5, 5, 5, 0.6)' : 'rgba(5, 5, 5, 0)',
          boxShadow: isScrolled ? '0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)' : 'none',
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

        {/* Mobile Toggle */}
        <button 
          className={styles.mobileToggle} 
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Menu"
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
        </motion.div>

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
