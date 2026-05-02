"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
  Trophy, 
  Camera, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';
import styles from './portal-produtor.module.css';
import Link from 'next/link';

type ProducerEvent = {
  id: string;
  title?: string | null;
  name?: string | null;
  event_date?: string | null;
  cover_url?: string | null;
  location?: string | null;
  commission_producer?: number | null;
};

export default function ProducerDashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    producerCommission: 0,
    totalSales: 0,
    activeEvents: 0
  });
  const [events, setEvents] = useState<ProducerEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchProducerData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch Events where user is producer
      const { data: producerEvents } = await supabase
        .from('events')
        .select('*')
        .eq('producer_id', user.id)
        .order('event_date', { ascending: false });

      setEvents(producerEvents || []);

      // 2. Fetch Split Stats
      const { data: splits } = await supabase
        .from('revenue_splits')
        .select('producer_amount, total_amount')
        .eq('producer_id', user.id);

      if (splits) {
        const totalRev = splits.reduce((acc, s) => acc + s.total_amount, 0);
        const prodComm = splits.reduce((acc, s) => acc + s.producer_amount, 0);
        setStats({
          totalRevenue: totalRev,
          producerCommission: prodComm,
          totalSales: splits.length,
          activeEvents: producerEvents?.length || 0
        });
      }
      setLoading(false);
    }

    fetchProducerData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <div className={styles.loading}>Carregando Portal do Produtor...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Painel do Produtor</h1>
          <p className={styles.subtitle}>Gerencie o faturamento dos seus eventos de dança.</p>
        </div>
        <Link href="/portal-produtor/novo-evento" className={styles.createBtn}>
          Criar Novo Evento
        </Link>
      </header>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(230, 0, 76, 0.1)' }}>
            <DollarSign color="var(--primary)" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Sua Comissão</span>
            <h2 className={styles.statValue}>R$ {stats.producerCommission.toLocaleString('pt-BR')}</h2>
          </div>
          <div className={styles.statTrend}>
            <ArrowUpRight size={16} />
            <span>Total Acumulado</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
            <TrendingUp color="#3b82f6" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Geração Total</span>
            <h2 className={styles.statValue}>R$ {stats.totalRevenue.toLocaleString('pt-BR')}</h2>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
            <Camera color="#10b981" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Vendas Realizadas</span>
            <h2 className={styles.statValue}>{stats.totalSales}</h2>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
            <Calendar color="#f59e0b" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Eventos Ativos</span>
            <h2 className={styles.statValue}>{stats.activeEvents}</h2>
          </div>
        </div>
      </div>

      <section className={styles.eventsSection}>
        <h3 className={styles.sectionTitle}>Seus Eventos</h3>
        <div className={styles.eventList}>
          {events.length === 0 ? (
            <div className={styles.emptyState}>
              <Calendar size={48} color="rgba(255,255,255,0.1)" />
              <p>Nenhum evento vinculado como produtor ainda.</p>
              <p style={{ fontSize: '0.85rem', opacity: 0.5, marginTop: '0.5rem' }}>
                Entre em contato com a plataforma para vincular seus eventos ao seu perfil.
              </p>
            </div>
          ) : (
            events.map((event) => (
              <div key={event.id} className={styles.eventCard}>
                <div className={styles.eventInfo}>
                  <h4>{event.name || event.title || 'Evento 4Dance'}</h4>
                  <span>{event.event_date ? new Date(event.event_date).toLocaleDateString('pt-BR') : 'Data não definida'}</span>
                </div>
                <div className={styles.eventMetrics}>
                  <div className={styles.metric}>
                    <span>Sua parte</span>
                    <strong>{event.commission_producer ?? 0}%</strong>
                  </div>
                  <ChevronRight size={20} color="rgba(255,255,255,0.3)" />
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Simulator Section */}
      {events.length > 0 && (
        <section className={styles.simulator}>
          <div className={styles.simulatorContent}>
            <h3>Simulador de Ganhos</h3>
            <p>Veja quanto você pode faturar no seu próximo evento.</p>
            <div className={styles.simInput}>
              <span>Se vender 100 fotos × R$15 → você ganha aprox. </span>
              <strong className={styles.highlight}>
                R$ {(100 * 15 * ((events[0].commission_producer ?? 15) / 100)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </strong>
            </div>
          </div>
          <div className={styles.simVisual}>
            <Trophy size={64} color="var(--primary)" />
          </div>
        </section>
      )}
    </div>
  );
}
