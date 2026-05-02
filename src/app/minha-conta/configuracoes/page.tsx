"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Lock, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import ClientSidebar from '@/components/ClientSidebar';
import { useToast } from '@/hooks/useToast';
import ToastContainer from '@/components/ToastContainer';
import styles from './page.module.css';

type Profile = {
  full_name?: string | null;
};

export default function ConfiguracoesPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [fullName, setFullName] = useState('');
  const [savingName, setSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const { toasts, showToast, removeToast } = useToast();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      setUserEmail(user.email ?? null);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile(profileData);
      setFullName(profileData?.full_name || '');
      setLoading(false);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    setSavingName(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim() })
      .eq('id', user.id);

    if (error) {
      showToast('Erro ao salvar nome. Tente novamente.', 'error');
    } else {
      setProfile(prev => ({ ...prev, full_name: fullName.trim() }));
      showToast('Nome atualizado com sucesso!', 'success');
    }
    setSavingName(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 6) {
      setPasswordError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas não coincidem.');
      return;
    }

    setSavingPassword(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userEmail!,
      password: currentPassword,
    });

    if (signInError) {
      setPasswordError('Senha atual incorreta.');
      setSavingPassword(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      showToast('Erro ao atualizar senha. Tente novamente.', 'error');
    } else {
      showToast('Senha alterada com sucesso!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    setSavingPassword(false);
  };

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <Loader2 className="animate-spin" size={48} color="var(--primary)" />
      </div>
    );
  }

  return (
    <div className={styles.portalContainer}>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ClientSidebar profile={profile} userEmail={userEmail} />

      <main className={styles.mainContent}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <header className={styles.pageHeader}>
            <h1>Configurações</h1>
            <p>Gerencie suas informações e segurança da conta.</p>
          </header>

          <div className={styles.sections}>
            {/* Nome */}
            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIcon} style={{ background: 'rgba(206,172,102,0.1)', color: 'var(--primary)' }}>
                  <User size={20} />
                </div>
                <div>
                  <h2>Informações Pessoais</h2>
                  <p>Atualize seu nome de exibição na plataforma.</p>
                </div>
              </div>

              <form onSubmit={handleSaveName} className={styles.form}>
                <div className={styles.field}>
                  <label htmlFor="fullName">Nome completo</label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Seu nome"
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label>E-mail</label>
                  <input type="email" value={userEmail || ''} disabled className={styles.disabled} />
                  <span className={styles.hint}>O e-mail não pode ser alterado por aqui.</span>
                </div>

                <button type="submit" disabled={savingName} className={styles.saveBtn}>
                  {savingName ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                  {savingName ? 'Salvando...' : 'Salvar nome'}
                </button>
              </form>
            </section>

            {/* Senha */}
            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIcon} style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>
                  <Lock size={20} />
                </div>
                <div>
                  <h2>Alterar Senha</h2>
                  <p>Recomendamos uma senha forte e única.</p>
                </div>
              </div>

              <form onSubmit={handleChangePassword} className={styles.form}>
                <div className={styles.field}>
                  <label htmlFor="currentPassword">Senha atual</label>
                  <input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="Sua senha atual"
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="newPassword">Nova senha</label>
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="confirmPassword">Confirmar nova senha</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    required
                  />
                </div>

                {passwordError && (
                  <div className={styles.errorMsg}>
                    <AlertCircle size={16} />
                    {passwordError}
                  </div>
                )}

                <button type="submit" disabled={savingPassword} className={styles.saveBtn}>
                  {savingPassword ? <Loader2 className="animate-spin" size={16} /> : <Lock size={16} />}
                  {savingPassword ? 'Alterando...' : 'Alterar senha'}
                </button>
              </form>
            </section>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
