"use client";

import { useState } from 'react';
import styles from './LeadForm.module.css';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { User, Mail, Phone, Lock, ChevronRight } from 'lucide-react';

interface LeadFormProps {
  onSuccess: () => void;
  eventSlug?: string;
  isOpen: boolean;
}

export default function LeadForm({ onSuccess, eventSlug, isOpen }: LeadFormProps) {
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSubmitError(null);

    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('leads')
        .insert([{
          name: formData.name,
          email: formData.email,
          whatsapp: formData.whatsapp,
          source_event_slug: eventSlug
        }]);

      if (error) throw error;

      // Save to local storage for premium persistence
      localStorage.setItem('4dance_lead', JSON.stringify({
        ...formData,
        timestamp: new Date().getTime()
      }));

      onSuccess();
    } catch (err: any) {
      setSubmitError('Não conseguimos conectar ao servidor. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className={styles.modal}
            initial={{ scale: 0.8, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 40 }}
            transition={{ type: "spring", damping: 20, stiffness: 120 }}
          >
            <div className={styles.iconWrapper}>
              <span className={styles.icon}>💎</span>
            </div>
            
            <h2 className={styles.title}>Acesse a Galeria</h2>
            <p className={styles.description}>
              Identifique-se para liberar o conteúdo premium e downloads em alta resolução.
            </p>

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  <User size={12} strokeWidth={3} style={{ marginBottom: '-2px', marginRight: '4px' }} /> Nome Completo
                </label>
                <input 
                  type="text" 
                  required 
                  className={styles.input}
                  placeholder="Seu nome"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  <Mail size={12} strokeWidth={3} style={{ marginBottom: '-2px', marginRight: '4px' }} /> E-mail
                </label>
                <input 
                  type="email" 
                  required 
                  className={styles.input}
                  placeholder="exemplo@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  <Phone size={12} strokeWidth={3} style={{ marginBottom: '-2px', marginRight: '4px' }} /> WhatsApp
                </label>
                <input 
                  type="tel" 
                  required 
                  className={styles.input}
                  placeholder="(00) 00000-0000"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                />
              </div>

              <button 
                type="submit" 
                className={styles.submitBtn}
                disabled={loading}
              >
                {submitError && (
                <p style={{ color: '#ef4444', fontSize: '0.82rem', marginBottom: '0.75rem', textAlign: 'center' }}>{submitError}</p>
              )}
              {loading ? (
                  <motion.span
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    Liberando Acesso Emocional...
                  </motion.span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    Acessar Galeria <ChevronRight size={18} />
                  </span>
                )}
              </button>
            </form>

            <div className={styles.footer}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '8px' }}>
                <Lock size={12} /> Conexão Segura
              </div>
              Ao acessar, você concorda em receber atualizações sobre novos álbuns e benefícios exclusivos 4Dance.
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
