"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import styles from './fotografo.module.css';
import { ArrowUpRight, TrendingUp, Clock, AlertCircle } from 'lucide-react';

export default function PhotographerDashboard() {
  const [stats, setStats] = useState({
    balance: 0,
    pending: 0,
    salesCount: 0,
    conversion: 0
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadStats() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: splits } = await supabase
        .from('revenue_splits')
        .select('photographer_amount, total_amount')
        .eq('photographer_id', user.id);

      if (splits) {
        const totalEarned = splits.reduce((acc, s) => acc + s.photographer_amount, 0);
        const totalSales = splits.length;
        
        setStats({
          balance: totalEarned,
          pending: 0, // Pending logic would depend on Stripe balance
          salesCount: totalSales,
          conversion: totalSales > 0 ? 15.2 : 0 // Placeholder for conversion
        });
      }
      setLoading(false);
    }
    loadStats();
  }, [supabase]);

  return (
    <div className={styles.dashboard}>
      {/* Carteira Section */}
      <section className={styles.walletCard}>
        <div className={styles.walletHeader}>
          <h3 className={styles.walletTitle}>Carteira</h3>
          <select className={styles.currencySelect}>
            <option>Real (R$)</option>
            <option>Dólar (US$)</option>
          </select>
        </div>

        <div className={styles.balanceInfo}>
          <p className={styles.balanceLabel}>Saldo disponível</p>
          <h4 className={styles.balanceValue}>
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.balance)}
          </h4>
        </div>

        <div className={styles.pendingInfo} style={{ display: 'flex', gap: '2rem', opacity: 0.8 }}>
          <div>
            <p style={{ fontSize: '0.75rem', opacity: 0.6, margin: 0 }}>A receber</p>
            <p style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.pending)}
            </p>
          </div>
          <button style={{ 
            marginLeft: 'auto', 
            background: '#ceac66', 
            color: '#000', 
            border: 'none', 
            padding: '0.5rem 1rem', 
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}>
            Solicitar Saque
          </button>
        </div>
      </section>

      {/* Infinity Banner Style */}
      <div style={{ 
        background: 'linear-gradient(90deg, #000 0%, #1e40af 100%)', 
        borderRadius: '12px', 
        padding: '1rem 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        cursor: 'pointer',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>4DANCE <span style={{ fontWeight: 300 }}>|</span></span>
          <span style={{ fontSize: '0.85rem' }}>Evolua seu plano e ganhe mais cashback</span>
        </div>
        <ArrowUpRight size={20} />
      </div>

      {/* Grid of Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: '#111', padding: '1rem', borderRadius: '12px', border: '1px solid #222' }}>
          <TrendingUp size={18} color="#ceac66" style={{ marginBottom: '8px' }} />
          <p style={{ fontSize: '0.75rem', opacity: 0.5, margin: 0 }}>Vendas (Mês)</p>
          <p style={{ fontSize: '1.2rem', fontWeight: 600, margin: '4px 0 0' }}>{stats.salesCount}</p>
        </div>
        <div style={{ background: '#111', padding: '1rem', borderRadius: '12px', border: '1px solid #222' }}>
          <Clock size={18} color="#3b82f6" style={{ marginBottom: '8px' }} />
          <p style={{ fontSize: '0.75rem', opacity: 0.5, margin: 0 }}>Conversão</p>
          <p style={{ fontSize: '1.2rem', fontWeight: 600, margin: '4px 0 0' }}>{stats.conversion}%</p>
        </div>
      </div>

      {/* Warning/Alert if Stripe not connected */}
      <div style={{ 
        background: 'rgba(239, 68, 68, 0.1)', 
        border: '1px solid rgba(239, 68, 68, 0.2)', 
        borderRadius: '12px', 
        padding: '1rem',
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start'
      }}>
        <AlertCircle size={20} color="#ef4444" />
        <div>
          <p style={{ fontSize: '0.9rem', fontWeight: 600, margin: '0 0 4px', color: '#ef4444' }}>Configuração Pendente</p>
          <p style={{ fontSize: '0.8rem', opacity: 0.8, margin: 0 }}>
            Você ainda não conectou sua conta Stripe. Ative para receber pagamentos automáticos.
          </p>
          <button style={{ 
            background: 'transparent', 
            color: '#fff', 
            textDecoration: 'underline', 
            border: 'none', 
            padding: 0, 
            marginTop: '8px',
            fontSize: '0.8rem',
            cursor: 'pointer'
          }}>
            Configurar agora
          </button>
        </div>
      </div>
    </div>
  );
}
