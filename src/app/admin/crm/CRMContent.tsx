"use client";

import styles from './crm.module.css';
import { 
  Users, 
  Search, 
  ShoppingCart, 
  BadgeDollarSign, 
  Printer, 
  MoreHorizontal,
  Mail,
  Phone,
  Clock,
  Zap,
  TrendingUp,
  Target,
  BarChart3,
  Calendar,
  CheckCircle2
} from 'lucide-react';

export default function CRMContent({ leads, orders, activities }: { leads: any[], orders: any[], activities: any[] }) {
  const MY_WHATSAPP = "61993574377"; 
  const WHATSAPP_BASE_URL = `https://wa.me/55${MY_WHATSAPP}`;

  // Logic to group customers by "Status" (Pipeline)
  const paidEmails = new Set(orders?.filter(o => o.status === 'paid').map(o => o.profiles?.email));
  const pendingEmails = new Set(orders?.filter(o => o.status === 'pending').map(o => o.profiles?.email));
  
  const sectors = {
    new: leads?.filter(l => !paidEmails.has(l.email) && !pendingEmails.has(l.email)) || [],
    interested: activities?.filter(a => a.activity_type === 'SCAN' && !paidEmails.has(a.customer_email)) || [],
    abandoned: orders?.filter(o => o.status === 'pending') || [],
    vip: orders?.filter(o => o.status === 'paid') || []
  };

  const totalRevenue = orders?.filter(o => o.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0) || 0;
  const conversionRate = leads && leads.length > 0 ? ((paidEmails.size / leads.length) * 100).toFixed(1) : 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={styles.container}>
      <div className={styles.kpiBar}>
        <div className={styles.kpiCard}>
          <TrendingUp size={20} color="var(--primary)" />
          <div>
            <h3>Receita Total</h3>
            <p>R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <Target size={20} color="#10b981" />
          <div>
            <h3>Taxa de Conversão</h3>
            <p>{conversionRate}%</p>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <BarChart3 size={20} color="#3b82f6" />
          <div>
            <h3>Interações de IA</h3>
            <p>{activities?.length || 0}</p>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <Users size={20} color="#8b5cf6" />
          <div>
            <h3>Base de Leads</h3>
            <p>{leads?.length || 0}</p>
          </div>
        </div>
      </div>

      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>4Dance CRM Elite</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: '0.5rem' }}>O Centro de Inteligência Alpha & Omega</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className={styles.printBtn} style={{ background: 'var(--primary)', color: 'black' }}>
            <Zap size={18} /> Disparar Campanha
          </button>
          <button type="button" onClick={handlePrint} className={styles.printBtn}>
            <Printer size={18} /> Exportar PDF / Imprimir
          </button>
        </div>
      </header>

      <div className={styles.pipeline}>
        {/* COLUNA: NOVOS LEADS */}
        <div className={styles.column}>
          <div className={styles.columnHeader}>
            <h3>BASE DE LEADS</h3>
            <span className={styles.count}>{sectors.new.length}</span>
          </div>
          <div className={styles.cardList}>
            {sectors.new.length > 0 ? sectors.new.map((lead: any) => (
              <div key={lead.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <div className={styles.cardName}>{lead.name}</div>
                    <div className={styles.cardEmail}>{lead.email}</div>
                  </div>
                  <Users size={14} color="var(--primary)" opacity={0.5} />
                </div>
                <div className={styles.cardMeta}>
                  <span className={styles.badge}><Calendar size={10} /> {new Date(lead.created_at).toLocaleDateString()}</span>
                  {lead.whatsapp && <span className={styles.badge}><Phone size={10} /> {lead.whatsapp}</span>}
                </div>
                <div className={styles.actions}>
                  <a href={`mailto:${lead.email}`} title="Enviar E-mail" className={styles.actionBtn}><Mail size={14} /></a>
                  <a href={`${WHATSAPP_BASE_URL}?text=Olá ${lead.name}! Vimos que você se cadastrou no 4Dance. Já conseguiu ver suas fotos?`} target="_blank" title="Chamar no Whats" className={styles.actionBtn}><Phone size={14} /></a>
                  <button title="Histórico" className={styles.actionBtn}><Clock size={14} /></button>
                </div>
              </div>
            )) : <p style={{ textAlign: 'center', opacity: 0.2, fontSize: '0.8rem', padding: '2rem' }}>Aguardando novos leads...</p>}
          </div>
        </div>

        {/* COLUNA: INTERESSADOS */}
        <div className={styles.column} style={{ borderTop: '4px solid #3b82f6' }}>
          <div className={styles.columnHeader}>
            <h3>COMPORTAMENTO IA</h3>
            <span className={styles.count} style={{ color: '#3b82f6' }}>{sectors.interested.length}</span>
          </div>
          <div className={styles.cardList}>
            {sectors.interested.length > 0 ? sectors.interested.slice(0, 10).map((act: any) => (
              <div key={act.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <div className={styles.cardName}>{act.customer_email.split('@')[0]}</div>
                    <div className={styles.cardEmail}>{act.customer_email}</div>
                  </div>
                  <Search size={14} color="#3b82f6" />
                </div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', background: 'rgba(59, 130, 246, 0.1)', padding: '8px', borderRadius: '8px' }}>
                   Buscou selfie em <strong>{act.events?.title || 'Evento'}</strong>
                </div>
                <div className={styles.actions}>
                  <a href={`${WHATSAPP_BASE_URL}?text=Olá! Vi que você buscou suas fotos no evento ${act.events?.title}. Conseguiu encontrar tudo?`} target="_blank" className={styles.actionBtn}><Phone size={14} /></a>
                  <button className={styles.actionBtn}><MoreHorizontal size={14} /></button>
                </div>
              </div>
            )) : <p style={{ textAlign: 'center', opacity: 0.2, fontSize: '0.8rem', padding: '2rem' }}>Nenhuma atividade recente.</p>}
          </div>
        </div>

        {/* COLUNA: RECUPERAÇÃO */}
        <div className={styles.column} style={{ borderTop: '4px solid #ef4444' }}>
          <div className={styles.columnHeader}>
            <h3>ABANDONOS (RECOVERY)</h3>
            <span className={styles.count} style={{ color: '#ef4444' }}>{sectors.abandoned.length}</span>
          </div>
          <div className={styles.cardList}>
            {sectors.abandoned.length > 0 ? sectors.abandoned.map((order: any) => (
              <div key={order.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <div className={styles.cardName}>{order.profiles?.full_name || 'Dançarino(a)'}</div>
                    <div className={styles.cardEmail}>{order.profiles?.email}</div>
                  </div>
                  <ShoppingCart size={14} color="#ef4444" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ef4444' }}>R$ {order.amount.toFixed(2)}</div>
                  <div className={styles.badge} style={{ color: '#ef4444' }}>PIX PENDENTE</div>
                </div>
                <div className={styles.actions}>
                  <a href={`${WHATSAPP_BASE_URL}?text=Olá! Vimos que você selecionou fotos incríveis, mas o pagamento não foi concluído. Quer ajuda para liberar suas memórias?`} target="_blank" className={styles.actionBtn} style={{ width: 'auto', padding: '0 10px', background: '#25d366' }}>
                    <Zap size={14} /> <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Resgatar Agora</span>
                  </a>
                  <button className={styles.actionBtn}><MoreHorizontal size={14} /></button>
                </div>
              </div>
            )) : <p style={{ textAlign: 'center', opacity: 0.2, fontSize: '0.8rem', padding: '2rem' }}>Parabéns! Vendas 100% convertidas. 🚀</p>}
          </div>
        </div>

        {/* COLUNA: VIP */}
        <div className={styles.column} style={{ borderTop: '4px solid #10b981' }}>
          <div className={styles.columnHeader}>
            <h3>FATURAMENTO REAL</h3>
            <span className={styles.count} style={{ color: '#10b981' }}>{sectors.vip.length}</span>
          </div>
          <div className={styles.cardList}>
            {sectors.vip.length > 0 ? sectors.vip.map((order: any) => (
              <div key={order.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <div className={styles.cardName}>{order.profiles?.full_name}</div>
                    <div className={styles.cardEmail}>Venda #{order.id.slice(0, 5)}</div>
                  </div>
                  <CheckCircle2 size={14} color="#10b981" />
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981' }}>R$ {order.amount.toFixed(2)}</div>
                <div className={styles.cardMeta}>
                  <span className={styles.badge} style={{ borderColor: '#10b981' }}>PAGO VIA STRIPE</span>
                </div>
                <div className={styles.actions}>
                  <button className={styles.actionBtn}><MoreHorizontal size={14} /></button>
                </div>
              </div>
            )) : <p style={{ textAlign: 'center', opacity: 0.2, fontSize: '0.8rem', padding: '2rem' }}>Aguardando primeira venda...</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
