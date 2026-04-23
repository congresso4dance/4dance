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


const eventSchema = z.object({
  title: z.string().min(3, 'Título é obrigatório'),
  event_date: z.string().min(1, 'Data é obrigatória'),
  location: z.string().optional(),
  styles: z.string().optional(),
  is_public: z.boolean().default(true),
  is_paid: z.boolean().default(true),
  photo_price: z.coerce.number().min(0, 'Valor inválido').default(10.00),
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
        styles: typeof data.styles === 'string' ? data.styles.split(',').map((s: string) => s.trim()) : data.styles,
        slug,
        is_public: data.is_public === 'true' || data.is_public === true
