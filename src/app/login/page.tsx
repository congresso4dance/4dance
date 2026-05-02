"use client";

import { useState, Suspense } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import styles from './login.module.css';

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get('error') === 'confirmation_failed'
      ? 'O link de confirmação expirou ou é inválido. Tente fazer login mesmo assim ou solicite um novo link.'
      : null
  );
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
      const msg = authError.message.toLowerCase();
      if (msg.includes('email not confirmed')) {
        setError('Confirme seu e-mail antes de fazer login. Verifique sua caixa de entrada (e spam).');
      } else if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
        setError('E-mail ou senha incorretos. Verifique seus dados e tente novamente.');
      } else {
        setError('Não foi possível fazer login. Tente novamente.');
      }
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
        const adminRoles = ['owner', 'admin', 'editor', 'assistant'];
        if (adminRoles.includes(profile.role.toLowerCase())) {
          window.location.href = '/admin';
        } else if (profile.role === 'PHOTOGRAPHER') {
          window.location.href = '/portal-fotografo';
        } else if (profile.role === 'PRODUCER') {
          window.location.href = '/portal-produtor';
        } else {
          window.location.href = '/minhas-fotos';
        }
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
          <Link href="/" className={styles.backLink}>
            <ArrowLeft size={18} />
            <span>Voltar para o site</span>
          </Link>
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
          <Link href="/redefinir-senha" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
            Esqueci minha senha
          </Link>
        </div>

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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
