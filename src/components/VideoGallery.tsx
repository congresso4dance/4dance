"use client";

import { useState } from 'react';
import { ShoppingBag, Download, Loader2 } from 'lucide-react';
import WatermarkGrid from './WatermarkGrid';

export type GalleryVideo = {
  id: string;
  title?: string | null;
};

type VideoGalleryProps = {
  videos: GalleryVideo[];
  purchasedVideoIds: string[];
  price: number;
};

export default function VideoGallery({ videos, purchasedVideoIds, price }: VideoGalleryProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const purchased = new Set(purchasedVideoIds);

  if (!videos || videos.length === 0) return null;

  const handleBuy = async (videoId: string) => {
    setLoadingId(videoId);
    try {
      const res = await fetch('/api/checkout-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Erro ao iniciar pagamento');
      }
      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Erro ao comprar vídeo');
      setLoadingId(null);
    }
  };

  return (
    <div style={{ marginTop: '3rem' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: '#fff' }}>Vídeos</h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1.25rem',
      }}>
        {videos.map((video) => {
          const isPurchased = purchased.has(video.id);
          return (
            <div key={video.id} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px',
              overflow: 'hidden',
            }}>
              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000' }}>
                <video
                  controls
                  playsInline
                  preload="metadata"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                >
                  <source src={`/api/videos/${video.id}/stream`} />
                </video>
                {!isPurchased && (
                  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                    <WatermarkGrid opacity={0.3} />
                  </div>
                )}
              </div>
              <div style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
                  {video.title || 'Vídeo do evento'}
                </span>
                {isPurchased ? (
                  <a
                    href={`/api/videos/${video.id}/stream?download=1`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      background: 'rgba(34,197,94,0.15)', color: '#22c55e',
                      padding: '0.5rem 0.9rem', borderRadius: '8px', fontSize: '0.85rem',
                      fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap',
                    }}
                  >
                    <Download size={16} /> Baixar
                  </a>
                ) : (
                  <button
                    onClick={() => handleBuy(video.id)}
                    disabled={loadingId === video.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      background: 'var(--primary)', color: '#fff', border: 'none',
                      padding: '0.5rem 0.9rem', borderRadius: '8px', fontSize: '0.85rem',
                      fontWeight: 700, cursor: loadingId === video.id ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap', opacity: loadingId === video.id ? 0.6 : 1,
                    }}
                  >
                    {loadingId === video.id ? <Loader2 size={16} className="animate-spin" /> : <ShoppingBag size={16} />}
                    {loadingId === video.id ? 'Aguarde...' : `Comprar R$ ${price}`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
