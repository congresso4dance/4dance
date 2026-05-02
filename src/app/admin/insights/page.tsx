import { createClient } from '@/utils/supabase/server';
import AdminNavbar from '@/components/AdminNavbar';
import styles from '../dashboard.module.css';
import { Brain, Search, Users, Activity, Zap, DollarSign, TrendingDown, LayoutGrid } from 'lucide-react';
import AnalyticsCharts from '@/components/AnalyticsCharts';

type OrderMetric = {
  created_at: string;
  amount: number | null;
  status: string | null;
};

function isPaidOrder(order: OrderMetric) {
  return order.status === 'paid' || order.status === 'completed';
}

export default async function InsightsPage() {
  const supabase = await createClient();

  // 1. Fetch Stats for Cards
  const { count: photosCount } = await supabase.from('photos').select('*', { count: 'exact', head: true });
  const { count: leadsCount } = await supabase.from('leads').select('*', { count: 'exact', head: true });
  const { count: totalSearches } = await supabase.from('search_logs').select('*', { count: 'exact', head: true });
  const { count: successSearches } = await supabase.from('search_logs').select('*', { count: 'exact', head: true }).eq('success', true);

  // 2. Financial Metrics
  const { data: orders } = await supabase.from('orders').select('created_at, amount, status');
  const paidOrders = (orders || []).filter(isPaidOrder);
  const pendingOrders = (orders || []).filter((order) => order.status === 'pending');
  
  const totalRevenue = paidOrders.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const pendingRevenue = pendingOrders.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  // 3. Prepare Chart Data (Revenue Timeline)
  const revenueByDay: Record<string, number> = {};
  paidOrders.forEach(o => {
    const day = new Date(o.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    revenueByDay[day] = (revenueByDay[day] || 0) + (o.amount || 0);
  });

  const revenueData = Object.keys(revenueByDay).map(day => ({
    date: day,
    amount: revenueByDay[day]
  })).slice(-7); // Last 7 days

  // 4. Prepare Chart Data (Order Distribution)
  const orderStatusData = [
    { name: 'Pagos', value: paidOrders.length },
    { name: 'Pendentes', value: pendingOrders.length }
  ];

  // 5. Prepare Funnel Data
  const funnelData = [
    { name: 'Leads Capturados', value: leadsCount || 0 },
    { name: 'Buscas IA Sucesso', value: successSearches || 0 },
    { name: 'Intenções de Compra', value: orders?.length || 0 },
    { name: 'Vendas Reais', value: paidOrders.length }
  ];

  const coveragePercent = photosCount ? Math.round(((totalSearches || 0) / (photosCount || 1)) * 100) : 0; // Simplified coverage metric

  return (
    <div className={styles.container}>
      <AdminNavbar active="insights" />

      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          <LayoutGrid size={32} color="var(--primary)" />
          <h1 className={styles.title}>Painel de Inteligência SaaS</h1>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.5)' }}>Visão estratégica de faturamento, performance de IA e conversão de clientes.</p>
      </header>

      {/* Main Stats Cards */}
      <section className={styles.stats} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <div className={styles.statCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <DollarSign size={24} color="#10b981" />
            <span style={{ fontSize: '0.8rem', color: '#10b981' }}>Liquidez Financeira</span>
          </div>
          <h3>Receita Real</h3>
          <p>R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>

        <div className={styles.statCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <TrendingDown size={24} color="#ef4444" />
            <span style={{ fontSize: '0.8rem', color: '#ef4444' }}>Recuperável</span>
          </div>
          <h3>Dinheiro na Mesa</h3>
          <p>R$ {pendingRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>

        <div className={styles.statCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <Zap size={24} color="#f59e0b" />
            <span style={{ fontSize: '0.8rem', color: '#10b981' }}>{successSearches || 0} Acertos</span>
          </div>
          <h3>Taxa de Acerto IA</h3>
          <p>{totalSearches ? Math.round(((successSearches || 0) / totalSearches) * 100) : 0}%</p>
        </div>

        <div className={styles.statCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <Users size={24} color="#a855f7" />
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>Base Total</span>
          </div>
          <h3>Leads Ativos</h3>
          <p>{leadsCount || 0}</p>
        </div>
      </section>

      {/* SaaS Charts Section */}
      <AnalyticsCharts 
        revenueData={revenueData} 
        orderStatusData={orderStatusData} 
        funnelData={funnelData} 
      />

      {/* System Health Status */}
      <section style={{ marginTop: '3rem', background: 'rgba(255,255,255,0.01)', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.2rem', marginBottom: '1.5rem' }}>
          <Activity size={20} color="var(--primary)" /> Diagnóstico do Ecossistema
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem' }}>INFRAESTRUTURA</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></div>
              <span style={{ fontWeight: 600 }}>Supabase & AWS OK</span>
            </div>
          </div>
          <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem' }}>MOTOR IA 2.0</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }}></div>
              <span style={{ fontWeight: 600 }}>Indexador SSD v1</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
