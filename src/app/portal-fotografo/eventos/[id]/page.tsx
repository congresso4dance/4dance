"use client";

import { useEffect, useState, use } from 'react';
import { createClient } from '@/utils/supabase/client';
import styles from '../../fotografo.module.css';
import { Camera, Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PHOTO_STORAGE_BUCKET } from '@/utils/storage-constants';

export default function PhotographerEventDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function loadEvent() {
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();
      
      if (data) setEvent(data);
      setLoading(false);
    }
    loadEvent();
  }, [id, supabase]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadStatus(`Preparando ${files.length} fotos...`);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let successCount = 0;
    try {
      const { applyWatermark } = await import('@/utils/watermark');

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadStatus(`Processando ${i + 1}/${files.length}...`);

        const fileExt = file.name.split('.').pop();
        const baseName = `${Date.now()}-${Math.random()}`;
        const fullPath = `${id}/full_${baseName}.${fileExt}`;
        const thumbPath = `${id}/thumb_${baseName}.${fileExt}`;

        // 1. Watermark
        const wmBlob = await applyWatermark(file);
        const wmFile = new File([wmBlob], `thumb_${file.name}`, { type: 'image/jpeg' });

        // 2. Upload High Res
        const { error: fullError } = await supabase.storage
          .from(PHOTO_STORAGE_BUCKET)
          .upload(fullPath, file);

        // 3. Upload Watermarked
        const { error: thumbError } = await supabase.storage
          .from(PHOTO_STORAGE_BUCKET)
          .upload(thumbPath, wmFile);

        if (!fullError && !thumbError) {
          const fullUrl = supabase.storage.from(PHOTO_STORAGE_BUCKET).getPublicUrl(fullPath).data.publicUrl;
          const thumbUrl = supabase.storage.from(PHOTO_STORAGE_BUCKET).getPublicUrl(thumbPath).data.publicUrl;

          await supabase.from('photos').insert({
            event_id: id,
            full_res_url: fullUrl,
            thumbnail_url: thumbUrl,
            storage_path: fullPath,
            photographer_id: user.id
          });
          successCount++;
        }
      }
      setUploadStatus(`Sucesso! ${successCount} fotos enviadas.`);
      setTimeout(() => setUploadStatus(''), 3000);
    } catch (err) {
      console.error(err);
      setUploadStatus('Erro no processamento das imagens.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return null;
  if (!event) return <div className={styles.container}>Evento não encontrado.</div>;

  return (
    <div className={styles.eventDetail}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', margin: '0 0 8px' }}>{event.title}</h2>
        <p style={{ opacity: 0.5, fontSize: '0.9rem' }}>Envie suas fotos para este evento</p>
      </div>

      {/* Upload Zone */}
      <div style={{ 
        background: 'rgba(255,255,255,0.03)', 
        border: '2px dashed rgba(255,255,255,0.1)', 
        borderRadius: '24px',
        padding: '3rem 2rem',
        textAlign: 'center',
        position: 'relative'
      }}>
        {uploading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <Loader2 className={styles.spin} size={40} color="#ceac66" />
            <p style={{ fontWeight: 600 }}>{uploadStatus}</p>
          </div>
        ) : (
          <>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              background: 'rgba(206, 172, 102, 0.1)', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 1.5rem'
            }}>
              <Upload size={32} color="#ceac66" />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Clique para enviar fotos</h3>
            <p style={{ fontSize: '0.85rem', opacity: 0.4, marginBottom: '2rem' }}>
              Formatos aceitos: JPG, PNG. <br/>A marca d'água será aplicada automaticamente.
            </p>
            
            <input 
              type="file" 
              multiple 
              accept="image/*"
              onChange={handleUpload}
              style={{ 
                position: 'absolute', 
                inset: 0, 
                opacity: 0, 
                cursor: 'pointer' 
              }} 
            />

            <button style={{ 
              background: '#ceac66', 
              color: '#000', 
              border: 'none', 
              padding: '0.8rem 2rem', 
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '1rem'
            }}>
              Selecionar Arquivos
            </button>
          </>
        )}

        {uploadStatus && !uploading && (
          <div style={{ 
            marginTop: '1.5rem', 
            color: uploadStatus.includes('Erro') ? '#ef4444' : '#22c55e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '0.9rem'
          }}>
            {uploadStatus.includes('Erro') ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            {uploadStatus}
          </div>
        )}
      </div>

      {/* Quick Stats for Event */}
      <div style={{ marginTop: '2.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1.2rem' }}>Informações do Evento</h3>
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '1.2rem', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ opacity: 0.5 }}>Sua Comissão</span>
            <span style={{ fontWeight: 600, color: '#22c55e' }}>{100 - (event.commission_rate || 10)}%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ opacity: 0.5 }}>Plataforma</span>
            <span style={{ fontWeight: 600 }}>{event.commission_rate || 10}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
