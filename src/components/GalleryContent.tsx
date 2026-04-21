"use client";

import { useState, useEffect, useRef } from 'react';
import styles from '@/app/eventos/[slug]/gallery.module.css';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { Heart, Share2, Download, X, ChevronLeft, ChevronRight, Lock, Filter } from 'lucide-react';
import Image from 'next/image';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import LeadForm from './LeadForm';
import GallerySearch from './GallerySearch';

// Componente para item de foto com Parallax Individual (Apple Elite)
const ParallaxPhoto = ({ photo, index, onSelect, onImageLoad, handleDownload, isFavorite, onToggleFavorite }: any) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, -20]);
  const smoothY = useSpring(y, { stiffness: 60, damping: 20 });

  return (
    <motion.div 
      ref={ref}
      className={styles.photoItem}
      layoutId={`photo-${photo.id}`}
      style={{ y: smoothY }}
    >
      <div className={styles.imageWrapper} onClick={onSelect}>
        <Image 
          src={photo.full_res_url} 
          alt="Foto 4Dance" 
          className={styles.galleryImg}
          width={600}
          height={800}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          loading={index < 6 ? "eager" : "lazy"}
          priority={index < 6}
          style={{ objectFit: 'cover' }}
        />
        <div className={styles.overlay}>
          <div className={styles.topActions}>
            <button 
              className={`${styles.iconBtn} ${isFavorite ? styles.favorited : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(photo.id);
              }}
            >
              <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
            </button>
          </div>
          <button 
            className={styles.downloadBtn}
            onClick={(e) => {
              e.stopPropagation();
              handleDownload(photo.full_res_url);
            }}
          >
            <Download size={18} />
            <span>Baixar Grátis</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default function GalleryContent({ event, photos }: { event: any, photos: any[] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [filteredPhotoIds, setFilteredPhotoIds] = useState<string[] | null>(null);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [isLeaded, setIsLeaded] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    // Carregar leads e favoritos
    const savedLead = localStorage.getItem('4dance_lead');
    if (savedLead) setIsLeaded(true);

    const savedFavs = localStorage.getItem(`4dance_favs_${event.id}`);
    if (savedFavs) setFavorites(JSON.parse(savedFavs));

    // Deep Linking: Abrir foto se houver ID na URL
    const photoId = searchParams.get('photo');
    if (photoId) {
      const idx = photos.findIndex(p => p.id === photoId);
      if (idx !== -1) setSelectedIndex(idx);
    }
    
    // Keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "Escape") closeLightbox();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, photos]);

  const toggleFavorite = (id: string) => {
    const newFavs = favorites.includes(id) 
      ? favorites.filter(fid => fid !== id)
      : [...favorites, id];
    
    setFavorites(newFavs);
    localStorage.setItem(`4dance_favs_${event.id}`, JSON.stringify(newFavs));
  };

  const handleShare = async (photo: any) => {
    const shareUrl = `${window.location.origin}${pathname}?photo=${photo.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Foto do evento ${event.title}`,
          text: 'Olha que foto incrível na 4Dance!',
          url: shareUrl,
        });
      } catch (err) {
        console.error("Erro ao compartilhar:", err);
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      showToast("Link da foto copiado para a área de transferência! ✨");
    }
  };

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
    const params = new URLSearchParams(searchParams);
    params.set('photo', photos[index].id);
    window.history.replaceState(null, '', `${pathname}?${params.toString()}`);
  };

  const closeLightbox = () => {
    setSelectedIndex(null);
    router.push(pathname, { scroll: false });
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleDownload = async (photoUrl: string) => {
    if (!isLeaded) {
      setShowLeadForm(true);
      return;
    }

    showToast("📸 Preparando sua foto em HD...");
    try {
      // Tentativa de download direto via Blob (Melhor UX)
      const response = await fetch(photoUrl, { mode: 'cors' });
      
      if (!response.ok) throw new Error('CORS_OR_NETWORK_ERROR');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `4dance-${event.slug}-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast("✅ Download concluído!");
    } catch (err) {
      console.warn("Download direto falhou, usando abertura em nova aba:", err);
      // Fallback: Abertura direta em nova aba
      window.open(photoUrl, '_blank');
      showToast("📸 Foto aberta em nova aba! Clique com o botão direito para salvar.");
    }
  };

  const handleNext = () => {
    if (selectedIndex !== null && selectedIndex < photos.length - 1) {
      const nextIdx = selectedIndex + 1;
      setSelectedIndex(nextIdx);
      const params = new URLSearchParams(searchParams);
      params.set('photo', photos[nextIdx].id);
      window.history.replaceState(null, '', `${pathname}?${params.toString()}`);
    }
  };

  const handlePrev = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      const prevIdx = selectedIndex - 1;
      setSelectedIndex(prevIdx);
      const params = new URLSearchParams(searchParams);
      params.set('photo', photos[prevIdx].id);
      window.history.replaceState(null, '', `${pathname}?${params.toString()}`);
    }
  };

  const handleImageLoad = (id: string) => {
    // Mantido para compatibilidade se necessário, masImage do Next cuida disso
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const isSyncing = event.synced_photos < event.total_fb_photos;
  const syncProgress = event.total_fb_photos > 0 ? (event.synced_photos / event.total_fb_photos) * 100 : 0;

  let displayPhotos = filteredPhotoIds 
    ? photos.filter(p => filteredPhotoIds.includes(p.id))
    : photos;

  if (showOnlyFavorites) {
    displayPhotos = displayPhotos.filter(p => favorites.includes(p.id));
  }

  return (
    <>
      <div className={styles.searchBarRow}>
        <GallerySearch photos={photos} onFilter={setFilteredPhotoIds} />
        <div className={styles.filterGroup}>
          <button 
            className={`${styles.filterBtn} ${showOnlyFavorites ? styles.active : ''}`}
            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
          >
            <Heart size={18} fill={showOnlyFavorites ? "currentColor" : "none"} />
            Favoritas ({favorites.length})
          </button>
        </div>
      </div>
      
      {isSyncing && (
        <div className={styles.syncProgress}>
          <div className={styles.syncTitle}>
            <span>Resgatando Memórias em HD</span>
            <span>{Math.round(syncProgress)}%</span>
          </div>
          <div className={styles.progressBarContainer}>
            <div className={styles.progressBar} style={{ width: `${syncProgress}%` }}></div>
          </div>
          <p className={styles.syncStatus}>
            {event.synced_photos} de {event.total_fb_photos} fotos oficiais resgatadas...
          </p>
        </div>
      )}

      <motion.div 
        className={styles.masonry}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {displayPhotos?.map((photo, index) => (
          <ParallaxPhoto 
            key={photo.id}
            photo={photo}
            index={index}
            isFavorite={favorites.includes(photo.id)}
            onToggleFavorite={toggleFavorite}
            onSelect={() => openLightbox(index)}
            handleDownload={handleDownload}
          />
        ))}
      </motion.div>

      {/* --- LIGHTBOX APPLE QUALITY --- */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div 
            className={styles.lightboxOverlay} 
            onClick={closeLightbox}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className={styles.lightboxActions}>
              <button 
                className={`${styles.actionBtn} ${favorites.includes(photos[selectedIndex].id) ? styles.favorited : ''}`}
                onClick={(e) => { 
                  e.stopPropagation(); 
                  toggleFavorite(photos[selectedIndex].id); 
                }}
              >
                <Heart size={22} fill={favorites.includes(photos[selectedIndex].id) ? "currentColor" : "none"} />
              </button>
              <button 
                className={styles.actionBtn} 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  handleShare(photos[selectedIndex]); 
                }}
              >
                <Share2 size={22} />
              </button>
              <button 
                className={styles.actionBtn} 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  handleDownload(photos[selectedIndex].full_res_url); 
                }}
              >
                <Download size={22} />
              </button>
            </div>

            <button className={styles.closeBtn} onClick={closeLightbox}>
              <X size={24} />
            </button>

            {selectedIndex > 0 && (
              <button className={`${styles.navBtn} ${styles.prevBtn}`} onClick={(e) => { e.stopPropagation(); handlePrev(); }}>
                <ChevronLeft size={40} />
              </button>
            )}

            <motion.div 
              className={styles.lightboxContent} 
              onClick={(e) => e.stopPropagation()}
            >
              <Image 
                src={photos[selectedIndex].full_res_url} 
                alt="Ampliada" 
                className={styles.lightboxImage}
                width={1920}
                height={1080}
                style={{ objectFit: 'contain' }}
                priority
                unoptimized
              />
              <div className={styles.photoCounter}>
                <span>{selectedIndex + 1}</span> / {photos.length}
              </div>
            </motion.div>

            {selectedIndex < photos.length - 1 && (
              <button className={`${styles.navBtn} ${styles.nextBtn}`} onClick={(e) => { e.stopPropagation(); handleNext(); }}>
                <ChevronRight size={40} />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <LeadForm 
        isOpen={showLeadForm} 
        onSuccess={() => {
          setIsLeaded(true);
          setShowLeadForm(false);
        }}
        eventSlug={event.slug}
      />

      {toast && (
        <div className={styles.toastContainer}>
          <span>{toast}</span>
        </div>
      )}

      {(!photos || photos.length === 0) && (
        <div className={styles.empty}>
          <p>Estamos processando as fotos deste evento.</p>
          <button className={styles.notifyBtn} onClick={() => setShowLeadForm(true)}>
            Me avisar quando as fotos chegarem 🔔
          </button>
        </div>
      )}
    </>
  );
}
