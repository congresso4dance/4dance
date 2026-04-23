"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import styles from '../fotografo.module.css';
import { BarChart, LineChart, PieChart, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';

export default function PhotographerStats() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Simulating loading stats
    setTimeout(() => {
      setStats({
        totalSales: 15400.50,
        yourCommission: 13860.45,
        photosSold: 1024,
        topEvent: 'Congresso Zouk Lambada 2024',
        monthlyGrowth: 12.5
      });
      setLoading(false);
    }, 800);
  }, []);

  if (loading) return null;

  return (
    <div className={styles.statsPage}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Estatísticas</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '2rem' }}>
        {/* Main Performance Card */}
        <div style={{ 
          background: 'linear-gradient(135deg, #111 0%, #000 100%)', 
          borderRadius: '24px', 
          padding: '2rem', 
          border: '1px solid rgba(255,255,255,0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.05 }}>
            <Activity size={200} />
          </div>
          
          <p style={{ fontSize: '0.9rem', opacity: 0.5, margin: '0 0 8px' }}>Ganhos totais (Líquido)</p>
          <h3 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, color: '#ceac66' }}>
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.yourCommission)}
          </h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '1rem', color: '#22c55e', fontSize: '0.9rem' }}>
            <ArrowUpRight size={18} />
            <span>+{stats.monthlyGrowth}% em relação ao mês anterior</span>
          </div>
        </div>
      </div>

      {/* Grid de Métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ fontSize: '0.8rem', opacity: 0.5, margin: '0 0 8px' }}>Fotos Vendidas</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{stats.photosSold}</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ fontSize: '0.8rem', opacity: 0.5, margin: '0 0 8px' }}>Venda Média</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>R$ 15,00</p>
        </div>
      </div>

      <div style={{ marginTop: '2rem', background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <h4 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>Melhor Evento</h4>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.95rem' }}>{stats.topEvent}</span>
          <span style={{ color: '#ceac66', fontWeight: 600 }}>R$ 4.200,00</span>
        </div>
      </div>
    </div>
  );
}
