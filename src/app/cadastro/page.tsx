"use client";

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Lock, User, ArrowRight, CheckCircle2 } from 'lucide-react';
import styles from '../login/login.module.css'; // Reusing and extending login styles
import { sendWelcomeEmail } from '@/app/actions/email-actions';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isPhotographer, setIsPhotographer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Auth Signup
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      // 2. Create Profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          { 
            id: authData.user.id, 
            full_name: fullName,
            role: isPhotographer ? 'PHOTOGRAPHER' : 'CLIENT'
          }
        ]);

      if (profileError) {
        console.error("Erro ao criar perfil:", profileError);
      }

      // 3. Send Welcome Email (Instant via Resend)
      try {
        await sendWelcomeEmail(email, fullName);
      } catch (emailErr) {
        console.error("Erro ao enviar e-mail:", emailErr);
      }

      setSuccess(true);
      setLoading(false);
      setTimeout(() => router.push('/login'), 5000);
    }
  };

  if (success) {
    return (
      <main className={styles.main}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={styles.card}
          style={{ textAlign: 'center', padding: '3rem' }}
        >
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
            <CheckCircle2 size={64} color="#10b981" />
          </div>
          <h1 className={styles.title}>Conta Criada!</h1>
          <p className={styles.subtitle}>
            Enviamos um e-mail de confirmação. <br/>
            Redirecionando para o login em instantes...
          </p>
        </motion.div>
      </main>
    );
  }

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
            <UserPlus size={32} color="var(--primary)" />
          </div>
          <h1 className={styles.title}>Criar Conta 4Dance</h1>
          <p className={styles.subtitle}>Faça parte da elite da dança e acesse suas memórias.</p>
        </div>

        <form onSubmit={handleSignup} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="fullName"><User size={16} /> Nome Completo</label>
            <input 
              id="fullName" 
              type="text" 
              placeholder="Como quer ser chamado?"
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)} 
              required 
            />
          </div>

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
              placeholder="No mínimo 6 caracteres"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem' }}>
            <button 
              type="button"
              onClick={() => setIsPhotographer(false)}
              style={{ 
                flex: 1, 
                padding: '0.8rem', 
                borderRadius: '8px', 
                border: '1px solid', 
                borderColor: !isPhotographer ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                background: !isPhotographer ? 'rgba(230, 0, 76, 0.1)' : 'transparent',
                color: !isPhotographer ? 'var(--primary)' : 'rgba(255,255,255,0.5)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Sou Dançarino
            </button>
            <button 
              type="button"
              onClick={() => setIsPhotographer(true)}
              style={{ 
                flex: 1, 
                padding: '0.8rem', 
                borderRadius: '8px', 
                border: '1px solid', 
                borderColor: isPhotographer ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                background: isPhotographer ? 'rgba(230, 0, 76, 0.1)' : 'transparent',
                color: isPhotographer ? 'var(--primary)' : 'rgba(255,255,255,0.5)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Sou Fotógrafo
            </button>
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
              'Criando...'
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                Começar Agora <ArrowRight size={18} />
              </span>
            )}
          </button>
        </form>

        <div className={styles.footer}>
          Já tem uma conta? <Link href="/login">Fazer Login</Link>
        </div>
      </motion.div>
    </main>
  );
}
