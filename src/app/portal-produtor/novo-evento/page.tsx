"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, MapPin, DollarSign, CheckCircle2, Loader2 } from 'lucide-react';
import styles from '../portal-produtor.module.css';

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  padding: '0.85rem 1rem',
  color: '#fff',
  fontSize: '0.95rem',
  outline: 'none',
  boxSizing: 'border-box' as const,
};

const labelStyle = {
  fontSize: '0.85rem',
  color: 'rgba(255,255,255,0.6)',
  marginBottom: '8px',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

const fieldStyle = {
  marginBottom: '1.5rem',
};

export default function NovoEventoPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [photoPrice, setPhotoPrice] = useState('15.00');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login');
      else setUserId(user.id);
    });
  }, [supabase, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setError(null);
    setSaving(true);

    const baseSlug = slugify(title);
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    const { error: insertError } = await supabase
      .from('events')
      .insert({
        title,
        slug,
        event_date: eventDate,
        location: location || null,
        description: description || null,
        is_paid: isPaid,
        photo_price: isPaid ? parseFloat(photoPrice) : null,
        producer_id: userId,
        commission_photographer: 70,
        commission_producer: 15,
        commission_platform: 15,
        is_public: true,
      });

    if (insertError) {
      setError('Erro ao criar evento: ' + insertError.message);
      setSaving(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push('/portal-produtor'), 2000);
  };

  if (success) {
    return (
      <div className={styles.container} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
        <CheckCircle2 size={64} color="#10b981" />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Evento criado com sucesso!</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)' }}>Redirecionando para o painel...</p>
      </div>
    );
  }

  return (
    <div className={styles.container} style={{ maxWidth: '640px' }}>
      <Link href="/portal-produtor" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: '2rem', fontSize: '0.9rem' }}>
        <ArrowLeft size={16} /> Voltar ao painel
      </Link>

      <div className={styles.header} style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className={styles.title} style={{ fontSize: '1.8rem' }}>Novo Evento</h1>
          <p className={styles.subtitle}>Preencha os dados do evento para publicar na plataforma.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={fieldStyle}>
          <label style={labelStyle}><Calendar size={14} /> Título do Evento *</label>
          <input
            style={inputStyle}
            type="text"
            placeholder="Ex: Festival de Forró São João 2025"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}><Calendar size={14} /> Data do Evento *</label>
          <input
            style={inputStyle}
            type="date"
            value={eventDate}
            onChange={e => setEventDate(e.target.value)}
            required
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}><MapPin size={14} /> Local</label>
          <input
            style={inputStyle}
            type="text"
            placeholder="Ex: Centro de Convenções, São Paulo"
            value={location}
            onChange={e => setLocation(e.target.value)}
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Descrição</label>
          <textarea
            style={{ ...inputStyle, minHeight: '90px', resize: 'vertical' }}
            placeholder="Descreva o evento para os participantes..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        {/* Paid toggle */}
        <div style={{ ...fieldStyle, background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '1.2rem', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isPaid ? '1rem' : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={16} color="#ceac66" />
              <span style={{ fontWeight: 600 }}>Fotos pagas</span>
            </div>
            <button
              type="button"
              onClick={() => setIsPaid(p => !p)}
              style={{
                width: '48px', height: '26px', borderRadius: '13px', border: 'none', cursor: 'pointer',
                background: isPaid ? 'var(--primary)' : 'rgba(255,255,255,0.15)',
                position: 'relative', transition: 'background 0.2s',
              }}
            >
              <span style={{
                position: 'absolute', top: '3px',
                left: isPaid ? '25px' : '3px',
                width: '20px', height: '20px', borderRadius: '50%',
                background: '#fff', transition: 'left 0.2s',
              }} />
            </button>
          </div>

          {isPaid && (
            <div>
              <label style={labelStyle}>Preço por foto (R$)</label>
              <input
                style={{ ...inputStyle, width: '160px' }}
                type="number"
                min="1"
                step="0.50"
                value={photoPrice}
                onChange={e => setPhotoPrice(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Commission info */}
        <div style={{ background: 'rgba(206,172,102,0.08)', border: '1px solid rgba(206,172,102,0.2)', borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
          Comissão padrão: <strong style={{ color: '#ceac66' }}>70% Fotógrafo · 15% Produtor · 15% Plataforma</strong>
        </div>

        {error && (
          <p style={{ color: '#ef4444', fontSize: '0.9rem', marginBottom: '1rem' }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={saving || !title || !eventDate}
          style={{
            width: '100%', padding: '1rem', borderRadius: '12px', border: 'none',
            background: saving || !title || !eventDate ? 'rgba(255,255,255,0.1)' : 'var(--primary)',
            color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: saving || !title || !eventDate ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}
        >
          {saving ? <><Loader2 size={18} className="animate-spin" /> Criando evento...</> : 'Criar Evento'}
        </button>
      </form>
    </div>
  );
}
