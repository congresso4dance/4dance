"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import styles from '../fotografo.module.css';
import { CreditCard, ShieldCheck, User as UserIcon, Link as LinkIcon } from 'lucide-react';

export default function PhotographerSettings() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setProfile(data);
      setLoading(false);
    }
    loadProfile();
  }, [supabase]);

  const handleStripeConnect = async () => {
    setConnecting(true);
    try {
      const res = await fetch('/api/photographer/connect', { method: 'POST' });
      const data = await res.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Erro ao gerar link do Stripe: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (err) {
      alert('Erro de conexão com o servidor.');
    } finally {
      setConnecting(false);
    }
  };

  if (loading) return null;

  return (
    <div className={styles.settings}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Configurações</h2>

      {/* Profile Info */}
      <section style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '0.9rem', opacity: 0.5, textTransform: 'uppercase', marginBottom: '1rem' }}>Dados Pessoais</h3>
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
            <UserIcon size={20} color="#ceac66" />
            <div>
              <p style={{ fontSize: '0.8rem', opacity: 0.5, margin: 0 }}>Nome Completo</p>
              <p style={{ fontSize: '1rem', margin: 0 }}>{profile?.full_name}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShieldCheck size={20} color="#ceac66" />
            <div>
              <p style={{ fontSize: '0.8rem', opacity: 0.5, margin: 0 }}>Tipo de Conta</p>
              <p style={{ fontSize: '1rem', margin: 0 }}>Fotógrafo Profissional</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stripe Connect Section */}
      <section style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '0.9rem', opacity: 0.5, textTransform: 'uppercase', marginBottom: '1rem' }}>Pagamentos & Saques</h3>
        <div style={{ 
          background: 'rgba(255,255,255,0.03)', 
          borderRadius: '12px', 
          padding: '1.5rem', 
          border: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CreditCard size={24} color="#6366f1" />
            <div>
              <h4 style={{ margin: 0, fontSize: '1.1rem' }}>Stripe Connect</h4>
              <p style={{ fontSize: '0.85rem', opacity: 0.6, margin: '4px 0 0' }}>
                {profile?.stripe_account_id 
                  ? 'Sua conta está vinculada e pronta para receber.' 
                  : 'Vincule sua conta bancária para receber os valores das vendas automaticamente.'}
              </p>
            </div>
          </div>

          {!profile?.stripe_account_id ? (
            <button 
              onClick={handleStripeConnect}
              disabled={connecting}
              style={{ 
                background: connecting ? '#4b5563' : '#6366f1', 
                color: '#fff', 
                border: 'none', 
                padding: '1rem', 
                borderRadius: '8px', 
                fontWeight: 600, 
                cursor: connecting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <LinkIcon size={18} /> {connecting ? 'Gerando link...' : 'Conectar ao Stripe'}
            </button>
          ) : (
            <div style={{ 
              background: 'rgba(34, 197, 94, 0.1)', 
              color: '#22c55e', 
              padding: '0.8rem', 
              borderRadius: '8px', 
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: '1px solid rgba(34, 197, 94, 0.2)'
            }}>
              <ShieldCheck size={18} /> Conta Conectada com Sucesso
            </div>
          )}
        </div>
      </section>

      {/* Pix Key (Fallback) */}
      <section>
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
          <label style={{ fontSize: '0.85rem', opacity: 0.5, marginBottom: '8px', display: 'block' }}>Chave Pix para Emergências</label>
          <input 
            type="text" 
            placeholder="CPF, E-mail ou Celular" 
            defaultValue={profile?.pix_key || ''}
            style={{ 
              width: '100%', 
              background: '#111', 
              border: '1px solid #333', 
              padding: '0.8rem', 
              borderRadius: '8px', 
              color: '#fff' 
            }}
          />
          <button style={{ 
            marginTop: '1rem', 
            background: 'transparent', 
            border: '1px solid #ceac66', 
            color: '#ceac66', 
            padding: '0.6rem 1.2rem', 
            borderRadius: '8px',
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}>
            Salvar Chave
          </button>
        </div>
      </section>
    </div>
  );
}
