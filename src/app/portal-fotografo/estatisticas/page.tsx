"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import styles from '../fotografo.module.css';
import { ArrowUpRight, ArrowDownRight, Activity, Trophy, TrendingUp, Camera } from 'lucide-react';

type Split = {
  photographer_amount: number;
  total_amount: number;
  event_id: string;
  created_at: string;
};

type EventInfo = {
  id: string;
  title?: string | null;
  name?: string | null;
};

type StatsData = {
  totalEarned: number;
  thisMonthEarned: number;
  lastMonthEarned: number;
  totalSales: number;
  thisMonthSales: number;
  topEvent: string;
  topEventAmount: number;
  avgPerSale: number;
};

function brl(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function pct(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export default function PhotographerStats() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: splits } = await supabase
        .from('revenue_splits')
        .select('photographer_amount, total_amount, event_id, created_at')
        .eq('photographer_id', user.id)
        .order('created_at', { ascending: false });

      if (!splits || splits.length === 0) {
        setStats({
          totalEarned: 0, thisMonthEarned: 0, lastMonthEarned: 0,
          totalSales: 0, thisMonthSales: 0,
          topEvent: '—', topEventAmount: 0, avgPerSale: 0
        });
        setLoading(false);
        return;
      }

      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

      const thisMonth = (splits as Split[]).filter(s => s.created_at >= thisMonthStart);
      const lastMonth = (splits as Split[]).filter(s => s.created_at >= lastMonthStart && s.created_at <= lastMonthEnd);

      const totalEarned = (splits as Split[]).reduce((acc, s) => acc + s.photographer_amount, 0);
      const thisMonthEarned = thisMonth.reduce((acc, s) => acc + s.photographer_amount, 0);
      const lastMonthEarned = lastMonth.reduce((acc, s) => acc + s.photographer_amount, 0);

      // Top event by photographer earnings
      const byEvent: Record<string, number> = {};
      (splits as Split[]).forEach(s => {
        byEvent[s.event_id] = (byEvent[s.event_id] || 0) + s.photographer_amount;
      });
      const topEventId = Object.entries(byEvent).sort((a, b) => b[1] - a[1])[0]?.[0];
      const topEventAmount = topEventId ? byEvent[topEventId] : 0;

      let topEventName = '—';
      if (topEventId) {
        const { data: eventData } = await supabase
          .from('events')
          .select('id, title, name')
          .eq('id', topEventId)
          .single();
        const ev = eventData as EventInfo | null;
        topEventName = ev?.title || ev?.name || 'Evento';
      }

      setStats({
        totalEarned,
        thisMonthEarned,
        lastMonthEarned,
        totalSales: splits.length,
        thisMonthSales: thisMonth.length,
        topEvent: topEventName,
        topEventAmount,
        avgPerSale: splits.length > 0 ? totalEarned / splits.length : 0,
      });
      setLoading(false);
    }
    load();
  }, [supabase]);

  if (loading) return null;
  if (!stats) return null;

  const growth = pct(stats.thisMonthEarned, stats.lastMonthEarned);
  const isUp = growth >= 0;

  return (
    <div className={styles.statsPage}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Estatísticas</h2>

      {/* Main earnings card */}
      <div style={{
        background: 'linear-gradient(135deg, #111 0%, #000 100%)',
        borderRadius: '24px', padding: '2rem',
        border: '1px solid rgba(255,255,255,0.1)',
        position: 'relative', overflow: 'hidden', marginBottom: '1rem'
      }}>
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.05 }}>
          <Activity size={200} />
        </div>
        <p style={{ fontSize: '0.9rem', opacity: 0.5, margin: '0 0 8px' }}>Ganhos totais (Líquido)</p>
        <h3 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, color: '#ceac66' }}>
          {brl(stats.totalEarned)}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '1rem', color: isUp ? '#22c55e' : '#ef4444', fontSize: '0.9rem' }}>
          {isUp ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
          <span>{isUp ? '+' : ''}{growth}% em relação ao mês anterior</span>
        </div>
      </div>

      {/* Metrics grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <Camera size={18} color="#ceac66" style={{ marginBottom: '8px' }} />
          <p style={{ fontSize: '0.8rem', opacity: 0.5, margin: '0 0 4px' }}>Fotos Vendidas</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{stats.totalSales}</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <TrendingUp size={18} color="#3b82f6" style={{ marginBottom: '8px' }} />
          <p style={{ fontSize: '0.8rem', opacity: 0.5, margin: '0 0 4px' }}>Ticket Médio</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{brl(stats.avgPerSale)}</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ fontSize: '0.8rem', opacity: 0.5, margin: '0 0 4px' }}>Este mês</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#ceac66' }}>{brl(stats.thisMonthEarned)}</p>
          <p style={{ fontSize: '0.75rem', opacity: 0.4, margin: '4px 0 0' }}>{stats.thisMonthSales} vendas</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ fontSize: '0.8rem', opacity: 0.5, margin: '0 0 4px' }}>Mês anterior</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{brl(stats.lastMonthEarned)}</p>
          <p style={{ fontSize: '0.75rem', opacity: 0.4, margin: '4px 0 0' }}>{stats.thisMonthSales > 0 ? '' : '—'}</p>
        </div>
      </div>

      {/* Top Event */}
      {stats.topEventAmount > 0 && (
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
            <Trophy size={18} color="#ceac66" />
            <h4 style={{ margin: 0, fontSize: '1rem' }}>Melhor Evento</h4>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.95rem' }}>{stats.topEvent}</span>
            <span style={{ color: '#ceac66', fontWeight: 600 }}>{brl(stats.topEventAmount)}</span>
          </div>
        </div>
      )}

      {stats.totalSales === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem 0', opacity: 0.4 }}>
          <Camera size={48} />
          <p style={{ marginTop: '1rem' }}>Nenhuma venda registrada ainda.</p>
        </div>
      )}
    </div>
  );
}
