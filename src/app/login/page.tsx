"use client";

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import styles from './login.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Auth Sign In
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      // 2. Fetch User Profile to check Role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profile) {
        // Fallback for old users or missing profiles
        window.location.href = '/admin';
      } else {
        // Dynamic Redirect
        if (profile.role === 'ADMIN') {
          window.location.href = '/admin';
        } else {
          window.location.href = '/minhas-fotos';
        }
      }
  };

  return (
    <main className={styles.main}>
      <div className={styles.glassBackground}></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.card}
      >
        <div className={styles.header}>
          <div className={styles.logoIcon}>
            <LogIn size={32} color="var(--primary)" />
          </div>
          <h1 className={styles.title}>4Dance Login</h1>
          <p className={styles.subtitle}>Acesse suas memórias e gerencie sua galeria com segurança.</p>
        </div>

        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="email"><Mail size={16} /> Email</label>
            <input 
              id="email" 
              type="email" 
              placeholder="seu@email.com"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="password"><Lock size={16} /> Senha</label>
            <input 
              id="password" 
              type="password" 
              placeholder="Sua senha secreta"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className={styles.error}
            >
              {error}
            </motion.p>
          )}

          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? (
              'Autenticando...'
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                Entrar <ArrowRight size={18} />
              </span>
            )}
          </button>
        </form>

        <div className={styles.footer}>
          Não tem uma conta? <Link href="/cadastro">Criar agora</Link>
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', opacity: 0.3 }}>
           <ShieldCheck size={20} /> <span style={{ fontSize: '0.7rem', marginLeft: '5px' }}>Proteção Alpha Elite Ativa</span>
        </div>
      </motion.div>
    </main>
  );
}
