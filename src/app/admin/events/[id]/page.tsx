"use client";

import { useState, useEffect, useRef, use } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import AIIndexer from '@/components/AIIndexer';
import styles from '../edit-event.module.css';
import { signDisplayPhotos } from '@/app/actions/storage-actions';
import { useToast } from '@/hooks/useToast';
import ToastContainer from '@/components/ToastContainer';
import { PHOTO_STORAGE_BUCKET } from '@/utils/storage-constants';

const eventSchema = z.object({
  title: z.string().min(3, 'Título é obrigatório'),
  event_date: z.string().min(1, 'Data é obrigatória'),
  location: z.string().optional().nullable(),
  styles: z.string().optional().nullable(),
  is_public: z.any().optional(),
  is_paid: z.any().optional(),
  photo_price: z.any().optional(),
  commission_rate: z.any().optional(),
  photographer_id: z.string().optional().nullable(),
});

type EventFormValues = z.infer<typeof eventSchema>;

interface Photo {
  id: string;
  full_res_url: string;
  storage_path: string;
}

interface Photographer {
  id: string;
  full_name: string;
}

import { Trash2, CheckCircle2, X, Wallet, Camera } from 'lucide-react';
import { logAdminAction } from '@/utils/admin-logger';

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [coverPhotoId, setCoverPhotoId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { toasts, showToast, removeToast } = useToast();
  const originalCoverUrl = useRef('');
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
          commission_rate: event.commission_rate ?? 0.10,
          photographer_id: event.photographer_id || '',
        });
        originalCoverUrl.current = event.cover_url || '';
      }

      // 2. Fetch Photographers
      const { data: photogs } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .eq('role', 'PHOTOGRAPHER');

      if (photogs) setPhotographers(photogs);

      // 3. Fetch Photos and sign URLs
      const { data: photosData } = await supabase
        .from('photos')
        .select('*')
        .eq('event_id', id)
        .order('created_at', { ascending: true });

      if (photosData) {
        const signed = await signDisplayPhotos(photosData as unknown as Parameters<typeof signDisplayPhotos>[0]);
        setPhotos(signed as unknown as Photo[]);
        // Find which photo is the current cover by matching original URL
        const coverPhoto = (photosData as Photo[]).find(
          p => p.full_res_url === originalCoverUrl.current
        );
        if (coverPhoto) setCoverPhotoId(coverPhoto.id);
      }
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
        is_public: data.is_public === 'true' || data.is_public === true,
        is_paid: data.is_paid === 'true' || data.is_paid === true,
        photo_price: Number(data.photo_price),
        commission_rate: Number(data.commission_rate),
        photographer_id: data.photographer_id || null,
        styles: typeof data.styles === 'string' ? data.styles.split(',').map((s: string) => s.trim()) : data.styles
      })
      .eq('id', id);

    if (error) {
      showToast('Erro ao salvar: ' + error.message, 'error');
    } else {
      await logAdminAction('UPDATE_EVENT', { title: data.title }, id);
      showToast('Evento atualizado com sucesso!');
      router.refresh();
    }
    setSaving(false);
  };

  const setAsCover = async (photoId: string) => {
    // Fetch original (non-signed) URL from DB to store as cover
    const { data: photoData } = await supabase
      .from('photos')
      .select('full_res_url')
      .eq('id', photoId)
      .single();

    if (!photoData) return;

    const { error } = await supabase
      .from('events')
      .update({ cover_url: photoData.full_res_url })
      .eq('id', id);

    if (!error) {
      setCoverPhotoId(photoId);
      showToast('Capa atualizada!');
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

    await supabase.storage.from(PHOTO_STORAGE_BUCKET).remove([photo.storage_path]);
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
    await supabase.storage.from(PHOTO_STORAGE_BUCKET).remove(paths);
    
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
      await supabase.storage.from(PHOTO_STORAGE_BUCKET).remove(paths);
    }

    await logAdminAction('DELETE_EVENT', { photo_count: photos.length }, id);
    const { error } = await supabase.from('events').delete().eq('id', id);

    if (error) {
      showToast('Erro ao excluir: ' + error.message, 'error');
    } else {
      router.push('/admin');
    }
  };


  if (loading) return <div className={styles.container}>Carregando...</div>;

  return (
    <div className={styles.container}>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
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
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                  const baseName = `${Math.random()}`;
                  const fullPath = `${id}/full_${baseName}.${fileExt}`;
                  const thumbPath = `${id}/thumb_${baseName}.${fileExt}`;

                  try {
                    // 1. Aplicar Marca d'água para a Thumbnail
                    const { applyWatermark } = await import('@/utils/watermark');
                    const wmBlob = await applyWatermark(file);
                    const wmFile = new File([wmBlob], `thumb_${file.name}`, { type: 'image/jpeg' });

                    // 2. Upload da versão original (Limpa)
                    const { error: fullError } = await supabase.storage
                      .from(PHOTO_STORAGE_BUCKET)
                      .upload(fullPath, file);

                    // 3. Upload da versão com marca d'água
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
                        storage_path: fullPath
                      });
                      successCount++;
                    }
                  } catch (err) {
                    console.error("Erro no upload/watermark:", err);
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
              className={`${styles.photoCard} ${photo.id === coverPhotoId ? styles.isCover : ''} ${selectedIds.has(photo.id) ? styles.selected : ''}`}
            >
              <Image src={photo.full_res_url} alt="Foto do evento" fill unoptimized />
              {photo.id === coverPhotoId && <span className={styles.coverBadge}>CAPA</span>}
              <div className={styles.photoOverlay} onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setAsCover(photo.id)} className={styles.actionBtn}>Definir Capa</button>
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

