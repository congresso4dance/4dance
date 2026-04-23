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
  is_public: z.boolean().default(true),
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
