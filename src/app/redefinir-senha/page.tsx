"use client";

import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowLeft, KeyRound, CheckCircle } from 'lucide-react';
import styles from '../login/login.module.css';

function ResetForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'request' | 'update'>('request');

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      // Supabase redireciona com #access_token quando o link do e-mail é clicado
      const hash = window.location.hash;
      if (hash.includes('type=recovery')) {
        setMode('update');
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });

    if (error) {
      setError('Não foi possível enviar o e-mail. Verifique o endereço informado.');
    } else {
      setMessage('E-mail enviado! Verifique sua caixa de entrada e clique no link para criar uma nova senha.');
    }
    setLoading(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError('Não foi possível atualizar a senha. O link pode ter expirado.');
    } else {
      setMessage('Senha atualizada com sucesso!');
      setTimeout(() => router.push('/login'), 2000);
    }
    setLoading(false);
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
          <Link href="/login" className={styles.backLink}>
            <ArrowLeft size={18} />
            <span>Voltar para o login</span>
          </Link>
          <div className={styles.logoIcon}>
            <KeyRound size={32} color="var(--primary)" />
          </div>
          <h1 className={styles.title}>
            {mode === 'request' ? 'Esqueci minha senha' : 'Nova senha'}
          </h1>
          <p className={styles.subtitle}>
            {mode === 'request'
              ? 'Digite seu e-mail e enviaremos um link para criar uma nova senha.'
              : 'Digite sua nova senha abaixo.'}
          </p>
        </div>

        {message ? (
          <div style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            borderRadius: '12px',
            padding: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#22c55e',
            fontSize: '0.95rem',
            lineHeight: 1.5,
          }}>
            <CheckCircle size={24} style={{ flexShrink: 0 }} />
            <span>{message}</span>
          </div>
        ) : mode === 'request' ? (
          <form onSubmit={handleRequest} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="email"><Mail size={16} /> E-mail</label>
              <input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.error}>
                {error}
              </motion.p>
            )}

            <button type="submit" disabled={loading} className={styles.button}>
              {loading ? 'Enviando...' : 'Enviar link de recuperação'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleUpdate} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="password"><Lock size={16} /> Nova senha</label>
              <input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="confirm"><Lock size={16} /> Confirmar senha</label>
              <input
                id="confirm"
                type="password"
                placeholder="Repita a nova senha"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>

            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.error}>
                {error}
              </motion.p>
            )}

            <button type="submit" disabled={loading} className={styles.button}>
              {loading ? 'Salvando...' : 'Salvar nova senha'}
            </button>
          </form>
        )}

        <div className={styles.footer}>
          Lembrou a senha? <Link href="/login">Fazer login</Link>
        </div>
      </motion.div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
