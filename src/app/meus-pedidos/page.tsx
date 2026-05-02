"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Download, LayoutGrid, Sparkles, User, LogOut, Loader2, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import ToastContainer from '@/components/ToastContainer';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './portal.module.css';
import { signDisplayPhotos } from '@/app/actions/storage-actions';
import type { User as SupabaseUser } from '@supabase/supabase-js';

type Profile = {
  full_name?: string | null;
};

type PurchasedPhoto = {
  id: string;
  full_res_url: string;
  events?: {
    title?: string | null;
    is_paid?: boolean | null;
  } | null;
};

type DownloadResponse = {
  url?: string;
  error?: string;
};

export default function MyOrdersPage() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [purchasedPhotos, setPurchasedPhotos] = useState<PurchasedPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const { toasts, showToast, removeToast } = useToast();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function init() {
      // 1. Check Auth
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push('/login');
        return;
      }
      setUser(authUser);

      // 2. Load Profile
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();
      setProfile(userProfile);

      // 3. Load Completed Orders
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', authUser.id)
        .in('status', ['paid', 'completed']);

      if (orders && orders.length > 0) {
        // Flatten all photo IDs from all orders
        const allPhotoIds = orders.flatMap(order => order.items);
        
        // Fetch details for these photos
        if (allPhotoIds.length > 0) {
          const { data: photosData } = await supabase
            .from('photos')
            .select('*, events(title, is_paid)')
            .in('id', allPhotoIds);
          
          const signed = await signDisplayPhotos((photosData || []) as unknown as PurchasedPhoto[]);
          setPurchasedPhotos(signed as unknown as PurchasedPhoto[]);
        }
      }
      
      setLoading(false);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDownload = async (photo: PurchasedPhoto) => {
    setDownloading(photo.id);
    try {
      const response = await fetch(`${window.location.origin}/api/photos/get-download-url?photoId=${photo.id}`);
      const data = await response.json() as DownloadResponse;

      if (!response.ok || !data.url) throw new Error(data.error || 'Erro ao gerar link de download');

      // Create temporary link and trigger download
      const link = document.createElement('a');
      link.href = data.url;
      link.download = `4dance-${photo.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download error:', err);
      showToast('Erro ao gerar download. Tente novamente.', 'error');
    } finally {
      setDownloading(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <Loader2 className="animate-spin" size={48} color="var(--primary)" />
        <p>Acessando seu cofre de memórias...</p>
      </div>
    );
  }

  return (
    <div className={styles.portalContainer}>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <nav className={styles.sidebar}>
        <div className={styles.navTop}>
          <div className={styles.logo}>4DANCE <span>CLIENTE</span></div>
          <div className={styles.userProfile}>
            <div className={styles.avatar}>
              <User size={24} />
            </div>
            <div className={styles.userInfo}>
              <strong>{profile?.full_name || user?.email}</strong>
              <span>Dançarino Elite</span>
            </div>
          </div>
        </div>

        <div className={styles.navLinks}>
          <Link href="/minhas-fotos">
            <LayoutGrid size={20} /> Minha Galeria
          </Link>
          <Link href="/eventos">
            <Sparkles size={20} /> Descobrir Eventos
          </Link>
          <Link href="/meus-pedidos" className={styles.active}>
            <ShoppingBag size={20} /> Minhas Compras
          </Link>
        </div>

        <button onClick={handleLogout} className={styles.logoutBtn}>
          <LogOut size={20} /> Sair
        </button>
      </nav>

      <main className={styles.mainContent}>
        <header className={styles.header}>
          <div className={styles.titleArea}>
            <h1>Minhas Compras</h1>
            <p>Seu patrimônio de memórias 4Dance. Baixe suas fotos em HD a qualquer momento.</p>
          </div>
        </header>

        {purchasedPhotos.length > 0 ? (
          <div className={styles.photoGrid}>
            <AnimatePresence>
              {purchasedPhotos.map((photo) => (
                <motion.div 
                  key={photo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={styles.photoCard}
                >
                  <div className={styles.imageBox}>
                    <Image 
                      src={photo.full_res_url} 
                      alt="Sua foto comprada" 
                      fill 
                      style={{ objectFit: 'cover' }}
                      unoptimized 
                    />
                    <div className={styles.photoOverlay}>
                      <div className={styles.eventLabel}>
                        <Calendar size={12} /> {photo.events?.title}
                      </div>
                      
                      <button 
                        className={styles.downloadBtn}
                        onClick={() => handleDownload(photo)}
                        disabled={downloading === photo.id}
                      >
                        {downloading === photo.id ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : (
                          <Download size={16} />
                        )}
                        <span>{downloading === photo.id ? 'Gerando link...' : 'Download HD'}</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <ShoppingBag size={64} opacity={0.1} />
            <h3>Nenhuma compra encontrada</h3>
            <p>Suas fotos compradas aparecerão aqui automaticamente após a confirmação do pagamento.</p>
            <Link href="/eventos" className={styles.mainSearchBtn}>
              Explorar Galerias
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
