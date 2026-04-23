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
  styles: z.string().optional(),
  is_public: z.boolean(),
  is_paid: z.boolean().default(true),
  photo_price: z.coerce.number().min(0, 'Valor inválido').default(10.00),
});

type EventFormValues = z.infer<typeof eventSchema>;

interface Photo {
  id: string;
  full_res_url: string;
  storage_path: string;
}

import { Trash2, CheckCircle2, X } from 'lucide-react';
import { logAdminAction } from '@/utils/admin-logger';

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [coverUrl, setCoverUrl] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
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
          is_paid: event.is_paid ?? true,
          photo_price: event.photo_price ?? 15.00,
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
      .update({ 
        ...data,
        styles: typeof data.styles === 'string' ? data.styles.split(',').map((s: string) => s.trim()) : data.styles
      })
      .eq('id', id);

    if (error) {
      alert('Erro ao salvar: ' + error.message);
    } else {
      await logAdminAction('UPDATE_EVENT', { title: data.title }, id);
      showToast('Evento atualizado com sucesso!');
      router.refresh();
    }
    setSaving(false);
  };

  const setAsCover = async (url: string) => {
    const { error } = await supabase
      .from('events')
      .update({ cover_url: url })
      .eq('id', id);
    
    if (!error) {
      setCoverUrl(url);
      await logAdminAction('UPDATE_EVENT', { subtitle: 'Capa alterada' }, id);
    }
  };

  const togglePhotoSelection = (photoId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(photoId)) {
      newSelected.delete(photoId);
    } else {
      newSelected.add(photoId);
    }
    setSelectedIds(newSelected);
  };

  const deletePhoto = async (photo: Photo) => {
    if (!confirm('Deseja realmente apagar esta foto?')) return;

    await supabase.storage.from('event-photos').remove([photo.storage_path]);
    await supabase.from('photos').delete().eq('id', photo.id);
    
    await logAdminAction('DELETE_PHOTOS', { count: 1 }, id);
    setPhotos(photos.filter(p => p.id !== photo.id));
  };

  const deleteSelectedPhotos = async () => {
    const count = selectedIds.size;
    if (!confirm(`Deseja apagar as ${count} fotos selecionadas?`)) return;

    setSaving(true);
    const selectedPhotos = photos.filter(p => selectedIds.has(p.id));
    const paths = selectedPhotos.map(p => p.storage_path);

    // 1. Storage
    await supabase.storage.from('event-photos').remove(paths);
    
    // 2. DB
    await supabase.from('photos').delete().in('id', Array.from(selectedIds));

    await logAdminAction('DELETE_PHOTOS', { count }, id);
    setPhotos(photos.filter(p => !selectedIds.has(p.id)));
    setSelectedIds(new Set());
    setSaving(false);
    showToast(`${count} fotos removidas.`);
  };

  const deleteEvent = async () => {
    if (!confirm('ATENÇÃO: Isso apagará o evento e TODAS as fotos permanentemente. Prosseguir?')) return;
    
    const paths = photos.map(p => p.storage_path);
    if (paths.length > 0) {
      await supabase.storage.from('event-photos').remove(paths);
    }

    await logAdminAction('DELETE_EVENT', { photo_count: photos.length }, id);
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

          <div className={styles.inputGroup} style={{ background: 'rgba(206, 172, 102, 0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(206, 172, 102, 0.2)' }}>
            <label style={{ color: 'var(--primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" {...register('is_paid')} /> 💰 Evento Pago
            </label>
            <p style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '1rem' }}>
              Se desmarcado, todas as fotos serão gratuitas para download.
            </p>
            
            <label>Preço por Foto (R$)</label>
            <input type="number" step="0.01" {...register('photo_price')} />
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
                
                let successCount = 0;
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
                    successCount++;
                  }
                }
                
                if (successCount > 0) {
                  await logAdminAction('UPLOAD_PHOTOS', { count: successCount }, id);
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
            <div 
              key={photo.id} 
              onClick={() => togglePhotoSelection(photo.id)}
              className={`${styles.photoCard} ${photo.full_res_url === coverUrl ? styles.isCover : ''} ${selectedIds.has(photo.id) ? styles.selected : ''}`}
            >
              <Image src={photo.full_res_url} alt="Foto do evento" fill />
              {photo.full_res_url === coverUrl && <span className={styles.coverBadge}>CAPA</span>}
              <div className={styles.photoOverlay} onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setAsCover(photo.full_res_url)} className={styles.actionBtn}>Definir Capa</button>
                <button onClick={() => deletePhoto(photo)} className={`${styles.actionBtn} ${styles.deleteBtn}`}>Excluir</button>
              </div>
            </div>
          ))}
        </div>

        {selectedIds.size > 0 && (
          <div className={styles.bulkActions}>
            <div className={styles.bulkInfo}>
              {selectedIds.size} {selectedIds.size === 1 ? 'foto selecionada' : 'fotos selecionadas'}
            </div>
            <div className={styles.bulkBtns}>
              <button onClick={() => setSelectedIds(new Set())} className={styles.bulkCancelBtn}>
                <X size={16} /> Cancelar
              </button>
              <button onClick={deleteSelectedPhotos} className={styles.bulkDeleteBtn} disabled={saving}>
                <Trash2 size={16} /> {saving ? 'Apagando...' : 'Apagar em Massa'}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

