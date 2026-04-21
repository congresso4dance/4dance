"use client";

import { useState, useEffect, use } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import AIIndexer from '@/components/AIIndexer';
import styles from '../edit-event.module.css';

const eventSchema = z.object({
  title: z.string().min(3, 'Título é obrigatório'),
  event_date: z.string().min(1, 'Data é obrigatória'),
  location: z.string().optional(),
  styles: z.string().transform((val) => typeof val === 'string' ? val.split(',').map(s => s.trim()) : val),
  is_public: z.boolean(),
});

type EventFormValues = z.infer<typeof eventSchema>;

interface Photo {
  id: string;
  full_res_url: string;
  storage_path: string;
}

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [coverUrl, setCoverUrl] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
  });

  useEffect(() => {
    async function loadData() {
      // 1. Fetch Event
      const { data: event } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (event) {
        reset({
          title: event.title,
          event_date: event.event_date.split('T')[0],
          location: event.location || '',
          styles: event.styles?.join(', ') || '',
          is_public: event.is_public,
        });
        setCoverUrl(event.cover_url || '');
      }

      // 2. Fetch Photos
      const { data: photosData } = await supabase
        .from('photos')
        .select('*')
        .eq('event_id', id)
        .order('created_at', { ascending: true });

      if (photosData) setPhotos(photosData);
      setLoading(false);
    }
    loadData();
  }, [id, reset, supabase]);

  const onSubmit = async (data: any) => {
    setSaving(true);
    const { error } = await supabase
      .from('events')
      .update({ ...data })
      .eq('id', id);

    if (error) {
      alert('Erro ao salvar: ' + error.message);
    } else {
      alert('Evento atualizado!');
      router.refresh();
    }
    setSaving(false);
  };

  const setAsCover = async (url: string) => {
    const { error } = await supabase
      .from('events')
      .update({ cover_url: url })
      .eq('id', id);
    
    if (!error) setCoverUrl(url);
  };

  const deletePhoto = async (photo: Photo) => {
    if (!confirm('Deseja realmente apagar esta foto?')) return;

    // 1. Delete from Storage
    await supabase.storage.from('event-photos').remove([photo.storage_path]);

    // 2. Delete from DB
    await supabase.from('photos').delete().eq('id', photo.id);

    setPhotos(photos.filter(p => p.id !== photo.id));
  };

  const deleteEvent = async () => {
    if (!confirm('ATENÇÃO: Isso apagará o evento e TODAS as fotos permanentemente. Prosseguir?')) return;
    
    // 1. Delete Photos first (Storage)
    const paths = photos.map(p => p.storage_path);
    if (paths.length > 0) {
      await supabase.storage.from('event-photos').remove(paths);
    }

    // 2. Delete Event (Cascades to photos in DB)
    const { error } = await supabase.from('events').delete().eq('id', id);

    if (error) {
      alert('Erro ao excluir: ' + error.message);
    } else {
      router.push('/admin');
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  if (loading) return <div className={styles.container}>Carregando...</div>;

  return (
    <div className={styles.container}>
      {toast && <div className={styles.toast}>{toast}</div>}
      <header className={styles.header}>
        <h1 className={styles.title}>Editar Evento</h1>
        <button onClick={deleteEvent} className={styles.deleteEventBtn}>
          Excluir Evento
        </button>
      </header>

      <AIIndexer eventId={id} />

      <form onSubmit={handleSubmit(onSubmit)} className={styles.formSection}>
        <div className={styles.formGrid}>
          <div className={styles.inputGroup}>
            <label>Título</label>
            <input {...register('title')} />
            {errors.title && <span className={styles.error}>{errors.title?.message as string}</span>}
          </div>

          <div className={styles.inputGroup}>
            <label>Data</label>
            <input type="date" {...register('event_date')} />
          </div>

          <div className={styles.inputGroup}>
            <label>Local</label>
            <input {...register('location')} />
          </div>

          <div className={styles.inputGroup}>
            <label>Estilos (Zouk, Samba...)</label>
            <input {...register('styles')} />
          </div>

          <div className={styles.inputGroup}>
            <label>
              <input type="checkbox" {...register('is_public')} /> Público
            </label>
          </div>
        </div>

        <button type="submit" className={styles.submitBtn} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </form>

      <section className={styles.photoManagement}>
        <div className={styles.sectionHeader}>
          <h2>Gerenciar Fotos ({photos.length})</h2>
          <label className={styles.uploadBtn}>
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              onChange={async (e) => {
                const files = e.target.files;
                if (!files) return;
                
                showToast("🚀 Iniciando upload de " + files.length + " fotos...");
                
                for (let i = 0; i < files.length; i++) {
                  const file = files[i];
                  const fileExt = file.name.split('.').pop();
                  const fileName = `${Math.random()}.${fileExt}`;
                  const filePath = `${id}/${fileName}`;

                  const { error: uploadError } = await supabase.storage
                    .from('event-photos')
                    .upload(filePath, file);

                  if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage
                      .from('event-photos')
                      .getPublicUrl(filePath);

                    await supabase.from('photos').insert({
                      event_id: id,
                      full_res_url: publicUrl,
                      storage_path: filePath
                    });
                  }
                }
                router.refresh();
                window.location.reload();
              }} 
            />
            Upload de Fotos
          </label>
        </div>
        <div className={styles.photoGrid}>
          {photos.map((photo) => (
            <div key={photo.id} className={`${styles.photoCard} ${photo.full_res_url === coverUrl ? styles.isCover : ''}`}>
              <Image src={photo.full_res_url} alt="Foto do evento" fill />
              {photo.full_res_url === coverUrl && <span className={styles.coverBadge}>CAPA</span>}
              <div className={styles.photoOverlay}>
                <button onClick={() => setAsCover(photo.full_res_url)} className={styles.actionBtn}>Definir Capa</button>
                <button onClick={() => deletePhoto(photo)} className={`${styles.actionBtn} ${styles.deleteBtn}`}>Excluir</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
