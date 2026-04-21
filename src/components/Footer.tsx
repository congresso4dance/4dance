"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import styles from './Footer.module.css';
import Link from 'next/link';
import Image from 'next/image';

import { createClient } from '@/utils/supabase/client';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || loading) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('leads')
        .insert([{ 
          email, 
          name: 'Newsletter Footer',
          source_event_slug: 'home' 
        }]);

      if (error) throw error;

      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 5000);
    } catch (error) {
      console.error('Newsletter error:', error);
      alert('Ocorreu um erro ao se inscrever. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <Image 
              src="/logo/Logo l 4dance_BRANCA.png" 
              alt="4Dance Logo" 
              width={140} 
              height={40} 
            />
            <p>Registramos a essência da dança através de um olhar especializado e tecnologia focada na experiência do dançarino.</p>
            <div className={styles.contactInfo}>
              <p>agnaldomoita@gmail.com</p>
              <p>+55 61 99357-4377</p>
            </div>
          </div>
          
          <div className={styles.links}>
            <div className={styles.linkGroup}>
              <h4>Plataforma</h4>
              <Link href="/eventos">Galeria</Link>
              <Link href="/sobre">Sobre</Link>
              <Link href="/contrate">Contrate</Link>
            </div>
            
            <div className={styles.linkGroup}>
              <h4>Serviços</h4>
              <Link href="/contrate">Cobertura Profissional</Link>
              <Link href="/contrate">Parcerias</Link>
              <Link href="/login">Admin</Link>
            </div>
            
            <div className={styles.linkGroup}>
              <h4>Siga-nos</h4>
              <a href="https://www.instagram.com/4dance_brasil/" target="_blank" rel="noopener noreferrer">Instagram</a>
              <a href="https://www.facebook.com/congresso4dance" target="_blank" rel="noopener noreferrer">Facebook</a>
              <a href="https://wa.me/5561993574377" target="_blank" rel="noopener noreferrer">WhatsApp</a>
            </div>

            <div className={styles.newsletter}>
              <h4>NEWSLETTER</h4>
              <p>Receba avisos de novas fotos em primeira mão.</p>
              {subscribed ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={styles.success}
                >
                  Inscrito com sucesso! ✨
                </motion.div>
              ) : (
                <form className={styles.form} onSubmit={handleSubscribe}>
                  <input 
                    type="email" 
                    placeholder="Seu melhor e-mail" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <button type="submit" disabled={loading}>
                    {loading ? '...' : 'Inscrever'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
        
        <div className={styles.bottom}>
          <p>© {new Date().getFullYear()} 4Dance. Operando com Tecnologia 4D.</p>
          <div className={styles.legal}>
            <Link href="/privacidade">Privacidade</Link>
            <Link href="/termos">Termos</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
