"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X, ShoppingCart, CreditCard, QrCode, CheckCircle2, ChevronRight, Image as ImageIcon, Trash2, ShieldCheck, Wallet } from 'lucide-react';
import styles from '@/app/eventos/[slug]/gallery.module.css';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: any[];
  total: number;
  savings: number;
  originalTotal: number;
  onRemove: (id: string) => void;
  onSuccess: () => void;
}

export default function CheckoutModal({ isOpen, onClose, items, total, savings, originalTotal, onRemove, onSuccess }: CheckoutModalProps) {
  const [step, setStep] = useState<'summary' | 'payment'>('summary');
  const [method, setMethod] = useState<'pix' | 'card' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    if (items.length === 0) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          items, 
          eventId: items[0]?.eventId 
        }),
      });

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Erro ao criar sessão de checkout');
      }
    } catch (err: any) {
      alert("Erro no pagamento: " + err.message);
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className={styles.lightboxOverlay} style={{ zIndex: 3000, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(10px)' }} onClick={onClose}>
        <motion.div 
          className={styles.checkoutModal}
          style={{ 
            background: 'rgba(15,15,15,0.8)', 
            backdropFilter: 'blur(20px)', 
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '32px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          <header className={styles.checkoutHeader} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem 2rem' }}>
            <div className={styles.checkoutTitleGroup}>
              <div style={{ background: 'rgba(231,31,77,0.1)', padding: '8px', borderRadius: '12px' }}>
                <ShoppingCart size={22} color="var(--primary)" />
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Finalizar Compra</h2>
            </div>
            <button className={styles.closeBtn} onClick={onClose} style={{ position: 'static', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', padding: '6px' }}>
              <X size={20} />
            </button>
          </header>

          <div className={styles.checkoutBody} style={{ padding: '0' }}>
            {step === 'summary' ? (
              <div style={{ padding: '1.5rem 2rem' }}>
                <div className={styles.itemsList} style={{ maxHeight: '40vh', overflowY: 'auto', marginBottom: '1.5rem', paddingRight: '0.5rem' }}>
                  {items.length > 0 ? items.map((item) => (
                    <div key={item.id} className={styles.cartItemRow} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', marginBottom: '10px', padding: '10px' }}>
                      <div className={styles.cartItemThumb} style={{ borderRadius: '12px', overflow: 'hidden', width: '60px', height: '60px' }}>
                        <Image 
                          src={item.url} 
                          alt="Previa" 
                          width={60} 
                          height={60} 
                          style={{ objectFit: 'cover' }}
                          sizes="60px"
                        />
                      </div>
                      <div className={styles.cartItemInfo} style={{ flex: 1, marginLeft: '1rem' }}>
                        <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', display: 'block' }}>Foto HD #{item.id.slice(-6)}</span>
                        <strong style={{ fontSize: '1rem', color: 'var(--primary)' }}>R$ {item.price.toFixed(2)}</strong>
                      </div>
            <button className={styles.removeBtn} onClick={() => onRemove(item.id)} style={{ color: "rgba(255,255,255,0.2)" }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )) : (
                    <div className={styles.emptyCart} style={{ padding: '3rem 0' }}>
                      <ImageIcon size={48} color="rgba(255,255,255,0.1)" />
                      <p style={{ marginTop: '1rem', color: 'rgba(255,255,255,0.3)' }}>Seu carrinho está vazio.</p>
                    </div>
                  )}
                </div>

                <div className={styles.checkoutFooter} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
                  <div className={styles.totalRow} style={{ marginBottom: '1.5rem', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>Subtotal ({items.length} fotos)</span>
                      <span style={{ textDecoration: savings > 0 ? 'line-through' : 'none', color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>
                        R$ {originalTotal.toFixed(2)}
                      </span>
                    </div>
                    {savings > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', background: 'rgba(16, 185, 129, 0.1)', padding: '8px 12px', borderRadius: '12px', border: '1px dashed rgba(16, 185, 129, 0.3)', margin: '8px 0' }}>
                        <span style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: 700 }}>PACOTE ELITE ATIVADO! ✨</span>
                        <span style={{ color: '#10b981', fontWeight: 800 }}>- R$ {savings.toFixed(2)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginTop: '0.5rem' }}>
                      <span style={{ color: 'white', fontWeight: 500 }}>Total Final</span>
                      <strong style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>R$ {total.toFixed(2)}</strong>
                    </div>
                  </div>
                  <button 
                    className={styles.checkoutActionBtn} 
                    disabled={items.length === 0}
                    onClick={() => setStep('payment')}
                    style={{ 
                      borderRadius: '16px', 
                      padding: '1.2rem', 
                      fontSize: '1rem', 
                      fontWeight: 700, 
                      background: 'var(--primary)',
                      boxShadow: '0 10px 20px -5px rgba(231, 31, 77, 0.4)'
                    }}
                  >
                    Escolher Forma de Pagamento <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.paymentSection} style={{ padding: '1.5rem 2rem' }}>
                <button className={styles.backBtn} onClick={() => setStep('summary')} style={{ marginBottom: '1.5rem', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} /> Voltar ao Carrinho
                </button>

                <h3 className={styles.sectionLabel} style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginBottom: '1.5rem' }}>Pagamento Seguro de Elite</h3>
                
                <div className={styles.methodGrid} style={{ gap: '1rem' }}>
                  <div 
                    className={`${styles.methodCard} ${method === 'pix' ? styles.methodActive : ''}`}
                    onClick={() => setMethod('pix')}
                    style={{
                      background: method === 'pix' ? 'rgba(231,31,77,0.1)' : 'rgba(255,255,255,0.03)',
                      border: method === 'pix' ? '2px solid var(--primary)' : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '24px',
                      padding: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.8rem',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div style={{ background: method === 'pix' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '16px' }}>
                      <QrCode size={28} color="white" />
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>PIX Instantâneo</span>
                  </div>
                  
                  <div 
                    className={`${styles.methodCard} ${method === 'card' ? styles.methodActive : ''}`}
                    onClick={() => setMethod('card')}
                    style={{
                      background: method === 'card' ? 'rgba(231,31,77,0.1)' : 'rgba(255,255,255,0.03)',
                      border: method === 'card' ? '2px solid var(--primary)' : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '24px',
                      padding: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.8rem',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div style={{ background: method === 'card' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '16px' }}>
                      <CreditCard size={28} color="white" />
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Cartão de Crédito</span>
                  </div>
                </div>

                {method === 'pix' && (
                  <motion.div 
                    className={styles.pixArea}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className={styles.qrPlaceholder}>
                      <QrCode size={160} opacity={0.5} />
                      <div className={styles.qrOverlay}>QR CODE SIMULADO</div>
                    </div>
                    <p>Escaneie o código acima para pagar via PIX.</p>
                  </motion.div>
                )}

                {method === 'card' && (
                  <motion.div 
                    className={styles.cardArea}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className={styles.mockForm}>
                      <div className={styles.mockInput} />
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <div className={styles.mockInput} style={{ flex: 2 }} />
                        <div className={styles.mockInput} style={{ flex: 1 }} />
                      </div>
                    </div>
                    <p>Simulação segura de pagamento por cartão.</p>
                  </motion.div>
                )}

                <div className={styles.paymentActions}>
                  <button 
                    className={styles.payBtn} 
                    disabled={!method || isProcessing}
                    onClick={handlePayment}
                  >
                    {isProcessing ? 'Processando...' : `Pagar R$ ${total.toFixed(2)}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
