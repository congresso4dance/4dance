"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import styles from '../fotografo.module.css';
import { Globe, Copy, CheckCircle2, ExternalLink } from 'lucide-react';

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

export default function PhotographerSitePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [publicSlug, setPublicSlug] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data } = await supabase
        .from('profiles')
        .select('full_name, bio, public_slug, public_page_enabled')
        .eq('id', user.id)
        .single();

      if (data) {
        setFullName(data.full_name || '');
        setBio(data.bio || '');
        setPublicSlug(data.public_slug || slugify(data.full_name || ''));
        setEnabled(data.public_page_enabled || false);
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  const publicUrl = typeof window !== 'undefined' && publicSlug
    ? `${window.location.origin}/fotografo/${publicSlug}`
    : '';

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    setError(null);
    setSaved(false);

    const cleanSlug = slugify(publicSlug || fullName);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        bio: bio || null,
        public_slug: cleanSlug || null,
        public_page_enabled: enabled,
      })
      .eq('id', userId);

    setSaving(false);
    if (updateError) {
      setError(
        updateError.code === '23505'
          ? 'Esse link já está sendo usado por outro fotógrafo. Escolha outro.'
          : 'Erro ao salvar: ' + updateError.message
      );
      return;
    }

    setPublicSlug(cleanSlug);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleCopy = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return null;

  return (
    <div className={styles.settings}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Meu Site</h2>
      <p style={{ opacity: 0.5, fontSize: '0.9rem', marginBottom: '2rem' }}>
        Sua vitrine pública dentro do 4dance.com.br — mostra sua bio e os eventos que você fotografou.
      </p>

      <section style={{ marginBottom: '1.5rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Globe size={20} color="#ceac66" />
              <span style={{ fontWeight: 600 }}>Página pública ativa</span>
            </div>
            <button
              type="button"
              onClick={() => setEnabled((p) => !p)}
              style={{
                width: '48px', height: '26px', borderRadius: '13px', border: 'none', cursor: 'pointer',
                background: enabled ? 'var(--primary)' : 'rgba(255,255,255,0.15)',
                position: 'relative', transition: 'background 0.2s',
              }}
            >
              <span style={{
                position: 'absolute', top: '3px',
                left: enabled ? '25px' : '3px',
                width: '20px', height: '20px', borderRadius: '50%',
                background: '#fff', transition: 'left 0.2s',
              }} />
            </button>
          </div>

          <label style={{ fontSize: '0.85rem', opacity: 0.5, marginBottom: '8px', display: 'block' }}>Link da sua página</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', flex: 1, background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '0.7rem 0.9rem' }}>
              <span style={{ opacity: 0.4, fontSize: '0.9rem' }}>4dance.com.br/fotografo/</span>
              <input
                type="text"
                value={publicSlug}
                onChange={(e) => setPublicSlug(e.target.value)}
                placeholder="seu-nome"
                style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', fontSize: '0.9rem', flex: 1 }}
              />
            </div>
            {enabled && publicUrl && (
              <>
                <button onClick={handleCopy} type="button" title="Copiar link" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #333', borderRadius: '8px', padding: '0.7rem', cursor: 'pointer', color: '#fff' }}>
                  {copied ? <CheckCircle2 size={16} color="#22c55e" /> : <Copy size={16} />}
                </button>
                <a href={publicUrl} target="_blank" rel="noopener noreferrer" title="Abrir" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #333', borderRadius: '8px', padding: '0.7rem', cursor: 'pointer', color: '#fff', display: 'flex' }}>
                  <ExternalLink size={16} />
                </a>
              </>
            )}
          </div>

          <label style={{ fontSize: '0.85rem', opacity: 0.5, marginBottom: '8px', display: 'block' }}>Sobre você (aparece na sua página)</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Conte um pouco sobre seu trabalho como fotógrafo de dança..."
            style={{
              width: '100%', minHeight: '120px', resize: 'vertical', background: '#111',
              border: '1px solid #333', borderRadius: '8px', padding: '0.8rem', color: '#fff',
              fontSize: '0.9rem', fontFamily: 'inherit', boxSizing: 'border-box',
            }}
          />
        </div>
      </section>

      {error && <p style={{ color: '#ef4444', fontSize: '0.9rem', marginBottom: '1rem' }}>{error}</p>}

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            background: 'var(--primary)', color: '#fff', border: 'none', padding: '0.8rem 1.6rem',
            borderRadius: '10px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
        {saved && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#22c55e', fontSize: '0.9rem' }}>
            <CheckCircle2 size={16} /> Salvo!
          </span>
        )}
      </div>
    </div>
  );
}
