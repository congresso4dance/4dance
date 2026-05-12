"use client";

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useDropzone } from 'react-dropzone';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { logAdminAction } from '@/utils/admin-logger';
import styles from './new-event.module.css';

import { Camera, Wallet } from 'lucide-react';
import { useEffect } from 'react';
import { useToast } from '@/hooks/useToast';
import ToastContainer from '@/components/ToastContainer';

const eventSchema = z.object({
  title: z.string().min(3, 'Título é obrigatório'),
  event_date: z.string().min(1, 'Data é obrigatória'),
  location: z.string().optional().nullable(),
  styles: z.string().optional().nullable(),
  is_public: z.any().optional(),
  is_paid: z.any().optional(),
  photo_price: z.any().optional(),
  password: z.string().optional().nullable(),
  commission_rate: z.any().optional(),
  photographer_id: z.string().optional().nullable(),
});

type EventFormValues = z.infer<typeof eventSchema>;

interface Photographer {
  id: string;
  full_name: string;
}

export default function NewEventPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const router = useRouter();
  const { toasts, showToast, removeToast } = useToast();
  const supabase = createClient();

  const { register, handleSubmit, formState: { errors } } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      is_public: true,
      is_paid: true,
      photo_price: 10.00,
      commission_rate: 0.10,
      photographer_id: '',
      title: '',
      event_date: '',
      location: '',
      styles: '',
      password: '',
    }
  });

  useEffect(() => {
    async function loadPhotographers() {
      const { data } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .eq('role', 'PHOTOGRAPHER');
      if (data) setPhotographers(data);
    }
    loadPhotographers();
  }, [supabase]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: { 'image/*': [] }
  });

  const onSubmit = async (data: any) => {
    if (files.length === 0) {
      showToast('Selecione pelo menos uma foto.', 'error');
      return;
    }

    setUploading(true);
    const slug = data.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

    // 1. Create Event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert([{ 
        ...data, 
        is_public: data.is_public === 'true' || data.is_public === true,
        is_paid: data.is_paid === 'true' || data.is_paid === true,
        photo_price: Number(data.photo_price),
        commission_rate: Number(data.commission_rate),
        photographer_id: data.photographer_id || null,
        styles: typeof data.styles === 'string' ? data.styles.split(',').map((s: string) => s.trim()) : data.styles,
        slug,
      }])
      .select()
      .single();

    if (eventError) {
      showToast('Erro ao criar evento: ' + eventError.message, 'error');
      setUploading(false);
      return;
    }

    // NEW: Log the event creation
    await logAdminAction('CREATE_EVENT', { title: data.title }, event.id);

    // 2. Upload Photos with Watermark (via server-side API to bypass storage RLS)
    let count = 0;
    let errors = 0;
    for (const file of files) {
      try {
        const { compressImage } = await import('@/utils/compress-image');
        const { applyWatermark } = await import('@/utils/watermark');
        
        // Comprimir foto original para evitar erro 413
        const compressed = await compressImage(file);
        const wmBlob = await applyWatermark(compressed);
        const wmFile = new File([wmBlob], `thumb_${file.name}`, { type: 'image/jpeg' });

        const fd = new FormData();
        fd.append('full', compressed);
        fd.append('thumb', wmFile);
        fd.append('eventId', event.id);
        if (data.photographer_id) fd.append('photographerId', data.photographer_id);

        const res = await fetch('/api/admin/upload-photo', { method: 'POST', body: fd });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          console.error('Upload error:', body.error || res.status);
          errors++;
        }
      } catch (err) {
        console.error("Upload error:", err);
        errors++;
      }

      count++;
      setProgress(Math.round((count / files.length) * 100));
    }

    if (errors > 0) {
      showToast(`${errors} foto(s) falharam no upload. Verifique o console.`, 'error');
    }

    setUploading(false);
    showToast('Evento criado com sucesso!', 'success');
    setTimeout(() => router.push('/admin'), 1500);
  };

  return (
    <div className={styles.container}>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <h1 className={styles.title}>Criar Novo Evento</h1>

      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <div className={styles.formGrid}>
          <div className={styles.inputGroup}>
            <label>Título do Evento</label>
            <input {...register('title')} placeholder="Ex: Festival Zouk Lambada 2024" />
            {errors.title && <span className={styles.error}>{errors.title.message}</span>}
          </div>

          <div className={styles.inputGroup}>
            <label>Data</label>
            <input type="date" {...register('event_date')} />
            {errors.event_date && <span className={styles.error}>{errors.event_date.message}</span>}
          </div>

          <div className={styles.inputGroup}>
            <label>Localização</label>
            <input {...register('location')} placeholder="Ex: São Paulo, SP" />
          </div>

          <div className={styles.inputGroup}>
            <label>Estilos (separados por vírgula)</label>
            <input {...register('styles')} placeholder="Ex: Zouk, Lambada, Samba" />
          </div>

          <div className={styles.inputGroup} style={{ background: 'rgba(206, 172, 102, 0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(206, 172, 102, 0.2)' }}>
            <label style={{ color: 'var(--primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" {...register('is_paid')} /> 💰 Evento Pago
            </label>
            <p style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '1rem' }}>
              Se desmarcado, todas as fotos serão gratuitas para download.
            </p>
            
            <label>Preço por Foto (R$)</label>
            <input type="number" step="0.01" {...register('photo_price')} />
          </div>

          {/* Marketplace Section */}
          <div className={styles.inputGroup} style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem', marginBottom: '1.2rem', color: '#fff' }}>
              <Camera size={18} /> Marketplace do Fotógrafo
            </h3>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Wallet size={16} /> Comissão da Plataforma (%)
              </label>
              <input 
                type="number" 
                step="0.001" 
                {...register('commission_rate')} 
                placeholder="Ex: 0.100 para 10%" 
              />
              <p style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '4px' }}>
                Quanto a sua plataforma ganha sobre cada foto vendida.
              </p>
            </div>

            <div>
              <label>Fotógrafo Responsável</label>
              <select {...register('photographer_id')} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: '#111', border: '1px solid #333', color: '#fff' }}>
                <option value="">Selecione um fotógrafo...</option>
                {photographers.map(p => (
                  <option key={p.id} value={p.id}>{p.full_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" {...register('is_public')} /> Público
            </label>
          </div>
        </div>

        <div className={styles.dropzone} {...getRootProps()}>
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Solte as fotos aqui...</p>
          ) : (
            <p>Arraste e solte as fotos aqui, ou clique para selecionar</p>
          )}
          {files.length > 0 && (
            <p className={styles.fileCount}>{files.length} fotos selecionadas</p>
          )}
        </div>

        {uploading && (
          <div className={styles.progressContainer}>
            <div className={styles.progressBar} style={{ width: `${progress}%` }}></div>
            <span>Subindo fotos: {progress}%</span>
          </div>
        )}

        <button type="submit" className={styles.submitBtn} disabled={uploading}>
          {uploading ? 'Processando...' : 'Criar Evento e Subir Fotos'}
        </button>
      </form>
    </div>
  );
}
