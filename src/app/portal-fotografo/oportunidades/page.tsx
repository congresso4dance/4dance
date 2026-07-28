"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import styles from '../fotografo.module.css';
import { Calendar, MapPin, Users, CheckCircle2, Loader2 } from 'lucide-react';

type OpportunityEvent = {
  id: string;
  title: string;
  event_date: string;
  location: string | null;
  cover_url: string | null;
  commission_photographer: number | null;
};

export default function OportunidadesPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [events, setEvents] = useState<OpportunityEvent[]>([]);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);

      const today = new Date().toISOString().split('T')[0];

      const [{ data: openEvents }, { data: myLinks }] = await Promise.all([
        supabase
          .from('events')
          .select('id, title, event_date, location, cover_url, commission_photographer')
          .eq('open_to_photographers', true)
          .gte('event_date', today)
          .order('event_date', { ascending: true }),
        supabase
          .from('event_photographers')
          .select('event_id')
          .eq('photographer_id', user.id),
      ]);

      setEvents(openEvents || []);
      setJoinedIds(new Set((myLinks || []).map(l => l.event_id)));
      setLoading(false);
    }
    load();
  }, [supabase]);

  const handleJoin = async (eventId: string) => {
    if (!userId) return;
    setJoiningId(eventId);

    const { error } = await supabase
      .from('event_photographers')
      .insert({ event_id: eventId, photographer_id: userId, role: 'collaborator' });

    if (!error) {
      setJoinedIds(prev => new Set(prev).add(eventId));
    }
    setJoiningId(null);
  };

  if (loading) return null;

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Oportunidades</h2>
      <p style={{ opacity: 0.5, fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Eventos abertos por outros fotógrafos pra você cobrir junto. Você ganha sua comissão sobre as fotos que você mesmo vender.
      </p>

      {events.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '3rem 1rem', background: 'rgba(255,255,255,0.02)',
          borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)'
        }}>
          <Users size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
          <p style={{ opacity: 0.5 }}>Nenhum evento aberto pra fotógrafos no momento.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {events.map((event) => {
            const joined = joinedIds.has(event.id);
            return (
              <div
                key={event.id}
                style={{
                  background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '1.2rem',
                  border: '1px solid rgba(255,255,255,0.05)', display: 'flex',
                  alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
                  <div style={{
                    width: '60px', height: '60px', borderRadius: '12px', background: '#111',
                    backgroundImage: event.cover_url ? `url(${event.cover_url})` : 'none',
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0,
                  }} />
                  <div>
                    <h4 style={{ margin: '0 0 6px', fontSize: '1.05rem' }}>{event.title}</h4>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', opacity: 0.5, flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={14} /> {new Date(event.event_date).toLocaleDateString('pt-BR')}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={14} /> {event.location || 'Local não definido'}
                      </span>
                      <span style={{ color: '#22c55e', fontWeight: 600 }}>
                        {event.commission_photographer ?? 85}% de comissão
                      </span>
                    </div>
                  </div>
                </div>

                {joined ? (
                  <span style={{
                    display: 'flex', alignItems: 'center', gap: '6px', color: '#22c55e',
                    fontWeight: 600, fontSize: '0.9rem', padding: '0.6rem 1rem',
                  }}>
                    <CheckCircle2 size={16} /> Você já participa
                  </span>
                ) : (
                  <button
                    onClick={() => handleJoin(event.id)}
                    disabled={joiningId === event.id}
                    style={{
                      background: '#ceac66', color: '#000', border: 'none', padding: '0.7rem 1.5rem',
                      borderRadius: '10px', fontWeight: 700, fontSize: '0.9rem',
                      cursor: joiningId === event.id ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0,
                    }}
                  >
                    {joiningId === event.id ? <Loader2 size={16} className="animate-spin" /> : null}
                    Participar
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
