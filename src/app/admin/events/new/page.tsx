"use client";

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useDropzone } from 'react-dropzone';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import styles from './new-event.module.css';

const eventSchema = z.object({
  title: z.string().min(3, 'Título é obrigatório'),
  event_date: z.string().min(1, 'Data é obrigatória'),
  location: z.string().optional(),
  styles: z.string().transform((val) => val.split(',').map(s => s.trim())),
  is_public: z.boolean().default(true),
  password: z.string().optional(),
});

type EventFormValues = z.infer<typeof eventSchema>;

export default function NewEventPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const router = useRouter();
  const supabase = createClient();

  const { register, handleSubmit, formState: { errors } } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: { 'image/*': [] }
  });

  const onSubmit = async (data: any) => {
    if (files.length === 0) {
      alert('Selecione pelo menos uma foto.');
      return;
    }

    setUploading(true);
    const slug = data.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

    // 1. Create Event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert([{ 
        ...data, 
        slug,
        is_public: data.is_public === 'true' || data.is_public === true
      }])
      .select()
      .single();

    if (eventError) {
      alert('Erro ao criar evento: ' + eventError.message);
      setUploading(false);
      return;
    }

    // 2. Upload Photos
    let count = 0;
    for (const file of files) {
      const fileName = `${event.id}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('event-photos')
        .upload(fileName, file);

      if (uploadData) {
        await supabase.from('photos').insert([{
          event_id: event.id,
          storage_path: uploadData.path,
          full_res_url: supabase.storage.from('event-photos').getPublicUrl(uploadData.path).data.publicUrl
        }]);
      }
      
      count++;
      setProgress(Math.round((count / files.length) * 100));
    }

    setUploading(false);
    alert('Evento criado com sucesso!');
    router.push('/admin');
  };

  return (
    <div className={styles.container}>
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
