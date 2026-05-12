"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import styles from '../fotografo.module.css';
import { QrCode, Copy, ExternalLink, Camera, Check, Download } from 'lucide-react';

export default function PhotographerDivulgacao() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [qrModalUrl, setQrModalUrl] = useState<string | null>(null);
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

  const downloadQrCode = async (eventUrl: string, eventTitle: string) => {
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=20&data=${encodeURIComponent(eventUrl)}`;
    try {
      const res = await fetch(qrApiUrl);
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `qr-${eventTitle.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      window.open(qrApiUrl, '_blank');
    }
  };

  const downloadStory = (eventUrl: string, eventTitle: string, eventDate: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fundo preto
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Gradiente decorativo
    const grad = ctx.createRadialGradient(540, 960, 0, 540, 960, 900);
    grad.addColorStop(0, 'rgba(206,172,102,0.15)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Linha decorativa
    ctx.strokeStyle = '#ceac66';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(80, 500);
    ctx.lineTo(1000, 500);
    ctx.stroke();

    // Logo / marca
    ctx.fillStyle = '#ceac66';
    ctx.font = 'bold 72px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('4DANCE', 540, 420);

    // Título do evento
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 64px Arial';
    const words = eventTitle.split(' ');
    let line = '';
    let y = 620;
    for (const word of words) {
      const testLine = line + word + ' ';
      if (ctx.measureText(testLine).width > 900 && line) {
        ctx.fillText(line.trim(), 540, y);
        line = word + ' ';
        y += 80;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), 540, y);

    // Data
    if (eventDate) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '42px Arial';
      ctx.fillText(new Date(eventDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }), 540, y + 100);
    }

    // CTA
    ctx.fillStyle = '#ceac66';
    ctx.font = 'bold 48px Arial';
    ctx.fillText('Encontre suas fotos!', 540, 1400);

    // URL
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '34px Arial';
    ctx.fillText(eventUrl, 540, 1480);

    // Linha inferior
    ctx.strokeStyle = 'rgba(206,172,102,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, 1530);
    ctx.lineTo(1000, 1530);
    ctx.stroke();

    canvas.toBlob((blob) => {
      if (!blob) return;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `story-${eventTitle.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.click();
      URL.revokeObjectURL(link.href);
    }, 'image/png');
  };

  if (loading) return null;

  return (
    <div className={styles.divulgacaoPage}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Artes de Divulgação</h2>
      <p style={{ opacity: 0.6, fontSize: '0.95rem', marginBottom: '2rem' }}>
        Aumente suas vendas compartilhando o link direto dos seus eventos.
      </p>

      {events.length === 0 ? (
        <p style={{ opacity: 0.5, textAlign: 'center', padding: '2rem' }}>Nenhum evento para divulgar.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {events.map((event) => {
            const eventUrl = `${window.location.origin}/eventos/${event.slug}`;
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(eventUrl)}`;

            return (
              <div key={event.id} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '20px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{event.title}</h4>
                  <button
                    onClick={() => window.open(eventUrl)}
                    style={{ background: 'rgba(255,255,255,0.1)', border: 'none', padding: '8px', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}
                  >
                    <ExternalLink size={18} />
                  </button>
                </div>

                {/* Link */}
                <div style={{ background: '#111', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <code style={{ fontSize: '0.8rem', color: '#ceac66', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{eventUrl}</code>
                  <button
                    onClick={() => copyToClipboard(event.id, eventUrl)}
                    style={{ background: 'transparent', border: 'none', color: copiedId === event.id ? '#22c55e' : '#fff', cursor: 'pointer', flexShrink: 0 }}
                  >
                    {copiedId === event.id ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>

                {/* QR Code preview + botões */}
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '1.5rem', alignItems: 'center', marginBottom: '1rem' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrUrl}
                    alt="QR Code"
                    width={100}
                    height={100}
                    style={{ borderRadius: '8px', background: '#fff', padding: '4px' }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <button
                      onClick={() => downloadQrCode(eventUrl, event.title)}
                      style={{ background: '#fff', color: '#000', border: 'none', padding: '0.75rem 1rem', borderRadius: '10px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}
                    >
                      <QrCode size={18} /> Baixar QR Code
                    </button>
                    <button
                      onClick={() => downloadStory(eventUrl, event.title, event.event_date)}
                      style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '0.75rem 1rem', borderRadius: '10px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}
                    >
                      <Camera size={18} /> Arte para Story
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
