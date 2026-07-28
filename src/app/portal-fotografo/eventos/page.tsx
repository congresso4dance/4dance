"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import styles from '../fotografo.module.css';
import { Calendar, MapPin, ChevronRight, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

export default function PhotographerEvents() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadEvents() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Um evento pode ter vários fotógrafos vinculados (dono + colaboradores
      // que entraram via Oportunidades) — a lista de "meus eventos" precisa
      // considerar os dois casos, não só events.photographer_id (que só guarda
      // o dono original).
      const { data: links } = await supabase
        .from('event_photographers')
        .select('event_id')
        .eq('photographer_id', user.id);

      const eventIds = (links || []).map(l => l.event_id);
      if (eventIds.length === 0) {
        setEvents([]);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('events')
        .select('*')
        .in('id', eventIds)
        .order('event_date', { ascending: false });

      if (data) setEvents(data);
      setLoading(false);
    }
    loadEvents();
  }, [supabase]);

  if (loading) return null;

  return (
    <div className={styles.eventsPage}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Meus Eventos</h2>
        <Link
          href="/portal-fotografo/eventos/novo"
          style={{
            background: '#ceac66', color: '#000', textDecoration: 'none', fontWeight: 700,
            fontSize: '0.85rem', padding: '0.6rem 1.1rem', borderRadius: '10px',
          }}
        >
          + Criar Evento
        </Link>
      </div>

      {events.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem 1rem', 
          background: 'rgba(255,255,255,0.02)', 
          borderRadius: '16px',
          border: '1px dashed rgba(255,255,255,0.1)'
        }}>
          <ImageIcon size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
          <p style={{ opacity: 0.5 }}>Você ainda não possui eventos vinculados.</p>
          <p style={{ fontSize: '0.85rem', opacity: 0.3 }}>
            Crie o seu próprio evento ou veja as <Link href="/portal-fotografo/oportunidades" style={{ color: '#ceac66' }}>oportunidades</Link> abertas por outros fotógrafos.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {events.map((event) => (
            <Link 
              key={event.id} 
              href={`/fotografo/eventos/${event.id}`}
              style={{ 
                textDecoration: 'none', 
                color: 'inherit',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '16px',
                padding: '1.2rem',
                border: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'transform 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.01)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
                <div style={{ 
                  width: '60px', 
                  height: '60px', 
                  borderRadius: '12px', 
                  background: '#111',
                  backgroundImage: event.cover_url ? `url(${event.cover_url})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  border: '1px solid rgba(255,255,255,0.1)'
                }} />
                <div>
                  <h4 style={{ margin: '0 0 6px', fontSize: '1.05rem' }}>{event.title}</h4>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', opacity: 0.5 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={14} /> {new Date(event.event_date).toLocaleDateString('pt-BR')}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={14} /> {event.location || 'Local não definido'}
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRight size={20} style={{ opacity: 0.3 }} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
