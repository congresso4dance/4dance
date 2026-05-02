"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import styles from '../fotografo.module.css';
import { Share2, QrCode, Download, Copy, ExternalLink, Camera } from 'lucide-react';

export default function PhotographerDivulgacao() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadEvents() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('photographer_id', user.id)
        .order('event_date', { ascending: false });
      
      if (data) setEvents(data);
      setLoading(false);
    }
    loadEvents();
  }, [supabase]);

  const copyToClipboard = (eventId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(eventId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) return null;

  return (
    <div className={styles.divulgacaoPage}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Artes de Divulgação</h2>

      <p style={{ opacity: 0.6, fontSize: '0.95rem', marginBottom: '2rem' }}>
        Aumente suas vendas compartilhando o link direto dos seus eventos.
      </p>

      {events.length === 0 ? (
        <p style={{ opacity: 0.5, textAlign: 'center', padding: '2rem' }}>Nenhum evento para divulgar.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {events.map((event) => {
            const eventUrl = `${window.location.origin}/eventos/${event.slug}`;
            return (
              <div key={event.id} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '20px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{event.title}</h4>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => window.open(eventUrl)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', padding: '8px', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}>
                      <ExternalLink size={18} />
                    </button>
                  </div>
                </div>

                <div style={{ background: '#111', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <code style={{ fontSize: '0.85rem', color: '#ceac66' }}>{eventUrl}</code>
                  <button onClick={() => copyToClipboard(event.id, eventUrl)} style={{ background: 'transparent', border: 'none', color: copiedId === event.id ? '#22c55e' : '#fff', cursor: 'pointer' }}>
                    <Copy size={18} />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <button style={{ 
                    background: '#fff', 
                    color: '#000', 
                    border: 'none', 
                    padding: '0.8rem', 
                    borderRadius: '10px', 
                    fontWeight: 600, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '8px',
                    cursor: 'pointer'
                  }}>
                    <QrCode size={18} /> Baixar QR Code
                  </button>
                  <button style={{ 
                    background: 'rgba(255,255,255,0.1)', 
                    color: '#fff', 
                    border: 'none', 
                    padding: '0.8rem', 
                    borderRadius: '10px', 
                    fontWeight: 600, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '8px',
                    cursor: 'pointer'
                  }}>
                    <Camera size={18} /> Arte para Story
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
