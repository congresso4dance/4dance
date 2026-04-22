import { createClient } from '@/utils/supabase/server';
import AdminNavbar from '@/components/AdminNavbar';
import styles from '../dashboard.module.css';
import { ShoppingCart, MessageCircle, Clock, TrendingUp, AlertCircle, Phone } from 'lucide-react';
import Link from 'next/link';

export default async function SalesRecoveryPage() {
  const supabase = await createClient();

  // 1. Fetch pending orders with user info
  // Note: We'll join with user_profiles and then manually link with leads by email
  const { data: pendingOrders } = await supabase
    .from('orders')
    .select(`
      *,
      user_profiles (full_name, email)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  // 2. Fetch leads to get WhatsApp numbers
  const { data: leads } = await supabase
    .from('leads')
    .select('email, whatsapp, name');

  // Create a map for quick lead lookups
  const leadMap = new Map(leads?.map(l => [l.email, l]) || []);

  const abandonedCarts = pendingOrders?.map(order => {
    const email = order.user_profiles?.email;
    const lead = leadMap.get(email);
    
    return {
      ...order,
      customerName: order.user_profiles?.full_name || lead?.name || 'Cliente Desconhecido',
      customerEmail: email,
      whatsapp: lead?.whatsapp,
      isOld: new Date(order.created_at).getTime() < new Date().getTime() - (2 * 60 * 60 * 1000)
    };
  });

  const totalLeakage = abandonedCarts?.reduce((acc, curr) => acc + curr.amount, 0) || 0;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          <ShoppingCart size={32} color="var(--primary)" />
          <h1 className={styles.title}>Venda Proativa</h1>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.5)' }}>Resgate clientes que deixaram fotos no carrinho e não finalizaram o PIX.</p>
      </header>

      <div className={styles.stats}>
        <div className={styles.statCard} style={{ borderLeft: '4px solid #ef4444' }}>
          <TrendingUp size={24} color="#ef4444" style={{ marginBottom: '1rem' }} />
          <h3>Dinheiro Retido</h3>
          <p>R$ {totalLeakage.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>Total acumulado em {abandonedCarts?.length} carrinhos pendentes</span>
        </div>
      </div>

      <div style={{ marginTop: '3rem' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={20} /> Carrinhos Aguardando Atenção
        </h2>

        <div className={styles.tableWrapper} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <th style={{ padding: '1.2rem' }}>Cliente</th>
                <th style={{ padding: '1.2rem' }}>Fotos</th>
                <th style={{ padding: '1.2rem' }}>Valor</th>
                <th style={{ padding: '1.2rem' }}>Data</th>
                <th style={{ padding: '1.2rem' }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {abandonedCarts && abandonedCarts.length > 0 ? abandonedCarts.map((cart) => {
                const message = encodeURIComponent(`Olá ${cart.customerName}! 📸 Vimos que você selecionou fotos incríveis no 4Dance, mas o pedido ficou pendente. Quer que eu te ajude a liberar suas memórias agora?`);
                const waLink = `https://wa.me/${cart.whatsapp?.replace(/\D/g, '')}?text=${message}`;

                return (
                  <tr key={cart.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '1.2rem' }}>
                      <div style={{ fontWeight: 600 }}>{cart.customerName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{cart.customerEmail}</div>
                    </td>
                    <td style={{ padding: '1.2rem' }}>{cart.items?.length} fotos</td>
                    <td style={{ padding: '1.2rem', color: 'var(--primary)', fontWeight: 700 }}>R$ {cart.amount.toFixed(2)}</td>
                    <td style={{ padding: '1.2rem', fontSize: '0.8rem', color: cart.isOld ? '#ef4444' : 'rgba(255,255,255,0.5)' }}>
                      {new Date(cart.created_at).toLocaleString('pt-BR')}
                    </td>
                    <td style={{ padding: '1.2rem' }}>
                      {cart.whatsapp ? (
                        <a 
                          href={waLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '0.5rem', 
                            background: '#25d366', 
                            color: 'white', 
                            padding: '0.6rem 1rem', 
                            borderRadius: '100px',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            textDecoration: 'none'
                          }}
                        >
                          <Phone size={14} /> Resgatar
                        </a>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <AlertCircle size={12} /> Sem WhatsApp
                        </span>
                      )}
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                    Parabéns! Sem carrinhos abandonados no momento. 🚀
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
