"use client";

import { useState, Suspense } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Lock, User, ArrowRight, CheckCircle2, ArrowLeft } from 'lucide-react';
import styles from '../login/login.module.css'; // Reusing and extending login styles
import { sendWelcomeEmail } from '@/app/actions/email-actions';

function SignupForm() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role');
  const initialRole = roleParam === 'PHOTOGRAPHER' || roleParam === 'PRODUCER' ? roleParam : 'CLIENT';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<'CLIENT' | 'PHOTOGRAPHER' | 'PRODUCER'>(initialRole || 'CLIENT');
  const [honeypot, setHoneypot] = useState(''); // Anti-bot Honeypot
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 🛡️ Honeypot Check
    if (honeypot) {
      setSuccess(true);
      return;
    }

    setLoading(true);
    setError(null);

    // 1. Auth Signup
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
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
            role: selectedRole
          }
        ]);

      if (profileError) {
        console.error("Erro ao criar perfil:", profileError);
      }

      // 3. Send Welcome Email
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
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={styles.successCard}
      >
        <div className={styles.successIcon}>
          <CheckCircle2 size={64} color="#10b981" />
        </div>
        <h1 className={styles.title}>Cadastro Realizado!</h1>
        <p className={styles.subtitle}>
          Enviamos um e-mail de confirmação para <strong>{email}</strong>. 
          Por favor, verifique sua caixa de entrada (e spam) para ativar sua conta.
        </p>
        <div className={styles.loadingBar}>
          <motion.div 
            className={styles.loadingProgress}
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 5 }}
          />
        </div>
        <p className={styles.redirectText}>Redirecionando para o login em instantes...</p>
      </motion.div>
    );
  }

  return (
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
          <UserPlus size={32} color="var(--primary)" />
        </div>
        <h1 className={styles.title}>Criar Conta 4Dance</h1>
        <p className={styles.subtitle}>Junte-se à maior comunidade de fotografia de dança do Brasil.</p>
      </div>

      <form onSubmit={handleSignup} className={styles.form}>
        {/* Honeypot field (hidden from users) */}
        <div style={{ display: 'none' }}>
          <input 
            type="text" 
            value={honeypot} 
            onChange={(e) => setHoneypot(e.target.value)} 
            tabIndex={-1} 
            autoComplete="off" 
          />
        </div>

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
          <label htmlFor="email"><Mail size={16} /> Email Profissional</label>
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
            placeholder="Crie uma senha forte"
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            minLength={6}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '1.5rem' }}>
          <button 
            type="button"
            onClick={() => setSelectedRole('CLIENT')}
            style={{ 
              padding: '0.8rem 0.4rem', 
              borderRadius: '8px', 
              border: '1px solid', 
              borderColor: selectedRole === 'CLIENT' ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
              background: selectedRole === 'CLIENT' ? 'rgba(230, 0, 76, 0.1)' : 'transparent',
              color: selectedRole === 'CLIENT' ? 'var(--primary)' : 'rgba(255,255,255,0.5)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Sou Dançarino
          </button>
          <button 
            type="button"
            onClick={() => setSelectedRole('PHOTOGRAPHER')}
            style={{ 
              padding: '0.8rem 0.4rem', 
              borderRadius: '8px', 
              border: '1px solid', 
              borderColor: selectedRole === 'PHOTOGRAPHER' ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
              background: selectedRole === 'PHOTOGRAPHER' ? 'rgba(230, 0, 76, 0.1)' : 'transparent',
              color: selectedRole === 'PHOTOGRAPHER' ? 'var(--primary)' : 'rgba(255,255,255,0.5)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Sou Fotógrafo
          </button>
          <button 
            type="button"
            onClick={() => setSelectedRole('PRODUCER')}
            style={{ 
              padding: '0.8rem 0.4rem', 
              borderRadius: '8px', 
              border: '1px solid', 
              borderColor: selectedRole === 'PRODUCER' ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
              background: selectedRole === 'PRODUCER' ? 'rgba(230, 0, 76, 0.1)' : 'transparent',
              color: selectedRole === 'PRODUCER' ? 'var(--primary)' : 'rgba(255,255,255,0.5)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Sou Produtor
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
            'Processando...'
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
              Finalizar Cadastro <ArrowRight size={18} />
            </span>
          )}
        </button>
      </form>

      <div className={styles.footer}>
        Já tem uma conta? <Link href="/login">Fazer Login</Link>
      </div>
    </motion.div>
  );
}

export default function SignupPage() {
  return (
    <main className={styles.main}>
      <div className={styles.glassBackground}></div>
      <Suspense fallback={<div className={styles.loading}>Carregando...</div>}>
        <SignupForm />
      </Suspense>
    </main>
  );
}
