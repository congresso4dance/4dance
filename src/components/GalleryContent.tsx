"use client";

import { useState, useEffect, useRef } from 'react';
import styles from '@/app/eventos/[slug]/gallery.module.css';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { Heart, Share2, Download, X, ChevronLeft, ChevronRight, Lock, Filter, Target, ShoppingBag, ShoppingCart, CheckCircle2 } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import Image from 'next/image';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import LeadForm from './LeadForm';
import GallerySearch from './GallerySearch';
import CheckoutModal from './CheckoutModal';
import WatermarkGrid from './WatermarkGrid';
import * as faceapi from 'face-api.js';

// Componente para item de foto com Parallax Individual (Apple Elite)
const ParallaxPhoto = ({ photo, index, onSelect, onImageLoad, handleDownload, isFavorite, onToggleFavorite, onAddToCart, isInCart, isPaid }: any) => {
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
          src={photo.thumbnail_url} 
          alt="Foto 4Dance" 
          className={styles.galleryImg}
          width={0}
          height={0}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          loading={index < 6 ? "eager" : "lazy"}
          priority={index < 6}
          style={{ width: '100%', height: 'auto', objectFit: 'cover' }}
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
        />
        {isPaid && <WatermarkGrid />}
        <div className={styles.overlay}>
          {photo.isFiltered && (
            <div className={styles.iaBadges}>
              <motion.div 
                className={styles.purityBadge}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Target size={12} /> Confirmado
              </motion.div>
            </div>
          )}
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
          <div className={styles.bottomActions}>
            {isPaid ? (
              <button 
                className={`${styles.cartBtn} ${isInCart ? styles.inCart : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCart(photo);
                }}
              >
                {isInCart ? <><CheckCircle2 size={16} /> No Carrinho</> : <><ShoppingBag size={16} /> Comprar HD</>}
              </button>
            ) : (
              <button 
                className={styles.cartBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(photo);
                }}
              >
                <Download size={16} /> Baixar HD Grátis
              </button>
            )}
            <button 
              className={styles.downloadBtnMini}
              onClick={(e) => {
                e.stopPropagation();
                handleDownload(photo);
              }}
              title={isPaid ? "Baixar Prévia Grátis" : "Baixar HD Grátis"}
            >
              <Download size={16} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function GalleryContent({ event, photos: initialPhotos }: { event: any, photos: any[] }) {
  const [allPhotos, setAllPhotos] = useState<any[]>(initialPhotos);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [filteredPhotos, setFilteredPhotos] = useState<any[] | null>(null);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [isLeaded, setIsLeaded] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const { addToCart, isInCart, items, count, total, clearCart, removeFromCart } = useCart(event.id);
  const [showCart, setShowCart] = useState(false);
  const [focalPoint, setFocalPoint] = useState({ x: 50, y: 50 });
  const [isZooming, setIsZooming] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [displayLimit, setDisplayLimit] = useState(48);
  
  let displayPhotos = (filteredPhotos ? filteredPhotos : allPhotos).slice(0, displayLimit);
  if (showOnlyFavorites) {
    displayPhotos = (filteredPhotos ? filteredPhotos : allPhotos)
      .filter((p: any) => favorites.includes(p.id))
      .slice(0, displayLimit);
  }

  const isSyncing = event.synced_photos < event.total_fb_photos;
  const syncProgress = event.total_fb_photos > 0 ? (event.synced_photos / event.total_fb_photos) * 100 : 0;

  // Infinite Scroll Trigger desativado para manter o layout Masonry "liso" sem saltos de colunas.
  // Todas as fotos são carregadas do lado do servidor (page.tsx) permitindo que o next/image realize Lazy Loading otimizado e fluido.

  useEffect(() => {
    // Carregar leads e favoritos
    const savedLead = localStorage.getItem('4dance_lead');
    if (savedLead) setIsLeaded(true);

    const savedFavs = localStorage.getItem(`4dance_favs_${event.id}`);
    if (savedFavs) setFavorites(JSON.parse(savedFavs));

    // Deep Linking: Abrir foto se houver ID na URL
    const photoId = searchParams.get('photo');
    if (photoId) {
      const idx = allPhotos.findIndex(p => p.id === photoId);
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
  }, [selectedIndex, allPhotos]);
  
  // INFINITE SCROLL
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayLimit < (filteredPhotos ? filteredPhotos.length : allPhotos.length)) {
          setDisplayLimit(prev => prev + 24);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [loadMoreRef, displayLimit, filteredPhotos, allPhotos]);

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
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error("Erro ao compartilhar:", err);
        }
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      showToast("Link da foto copiado para a área de transferência! ✨");
    }
  };

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
    setIsZooming(false);
    setFocalPoint({ x: 50, y: 50 });
    
    const params = new URLSearchParams(searchParams);
    params.set('photo', displayPhotos[index].id);
    window.history.replaceState(null, '', `${pathname}?${params.toString()}`);

    // Trigger Intelligent Zoom Detection (Usa sempre a full_res_url para não cegar a IA)
    detectFaceForZoom(displayPhotos[index].full_res_url);
  };

  const detectFaceForZoom = async (url: string) => {
    setIsDetecting(true);
    try {
      // Pequeno delay para a animação do Lightbox abrir primeiro
      await new Promise(r => setTimeout(r, 600));

      const img = await faceapi.fetchImage(url);
      const detection = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions());

      if (detection) {
        const { box } = detection;
        const centerX = ((box.x + box.width / 2) / img.width) * 100;
        const centerY = ((box.y + box.height / 2) / img.height) * 100;
        
        setFocalPoint({ x: centerX, y: centerY });
        setIsZooming(true);
      }
    } catch (err) {
      console.warn("Cinema Flow detect error:", err);
    } finally {
      setIsDetecting(false);
    }
  };

  const closeLightbox = () => {
    setSelectedIndex(null);
    router.push(pathname, { scroll: false });
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleDownload = async (photo: any) => {
    if (!isLeaded && event.is_paid === false) {
      setShowLeadForm(true);
      return;
    }

    showToast("📸 Gerando seu link seguro de download...");
    try {
      const response = await fetch(`${window.location.origin}/api/photos/get-download-url?photoId=${photo.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao obter link de download');
      }

      const signedUrl = data.url;
      
      // Criar um link temporário e clicar para baixar
      const link = document.createElement('a');
      link.href = signedUrl;
      // Forçar download do arquivo original com nome limpo
      link.setAttribute('download', `4dance-${event.slug}-${photo.id.slice(-6)}.jpg`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast("✅ Download iniciado com sucesso!");
    } catch (err: any) {
      console.error("Download Error:", err);
      showToast(`❌ ${err.message || "Erro ao baixar foto"}`);
      
      if (err.message?.includes('comprada')) {
        setShowCart(true);
      }
    }
  };

  const handleNext = () => {
    if (selectedIndex !== null && selectedIndex < displayPhotos.length - 1) {
      const nextIdx = selectedIndex + 1;
      setSelectedIndex(nextIdx);
      const params = new URLSearchParams(searchParams);
      params.set('photo', displayPhotos[nextIdx].id);
      window.history.replaceState(null, '', `${pathname}?${params.toString()}`);
    }
  };

  const handlePrev = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      const prevIdx = selectedIndex - 1;
      setSelectedIndex(prevIdx);
      const params = new URLSearchParams(searchParams);
      params.set('photo', displayPhotos[prevIdx].id);
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

  return (
    <>
      <div className={styles.searchBarRow}>
        <div style={{ width: '100%' }}>
          <GallerySearch photos={allPhotos} eventId={event.id} onFilter={setFilteredPhotos} />
          <p style={{ 
            fontSize: '0.8rem', 
            color: 'rgba(255,255,255,0.4)', 
            marginTop: '10px', 
            padding: '0 10px',
            lineHeight: '1.4' 
          }}>
            ✨ Nota: Pode ser que a IA não encontre todas as suas fotos se você estiver de lado ou de costas enquanto dança. Continue explorando a galeria completa!
          </p>
        </div>
        <div className={styles.filterGroup}>
          <button 
            className={`${styles.filterBtn} ${showOnlyFavorites ? styles.active : ''}`}
            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
          >
            <Heart size={18} fill={showOnlyFavorites ? "currentColor" : "none"} />
            Favoritas ({favorites.length})
          </button>
          
          <button 
            className={`${styles.cartFloatingBtn} ${count > 0 ? styles.hasItems : ''}`}
            onClick={() => setShowCart(true)}
          >
            <ShoppingCart size={20} />
            {count > 0 && <span className={styles.cartBadge}>{count}</span>}
            <span className={styles.cartText}>Ver Carrinho (R$ {total.toFixed(2)})</span>
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
        key={filteredPhotos ? 'filtered' : 'all'}
        className={styles.masonry}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {displayPhotos?.map((photo, index) => (
          <ParallaxPhoto 
            key={photo.id}
            photo={{ ...photo, isFiltered: !!filteredPhotos }}
            index={index}
            isFavorite={favorites.includes(photo.id)}
            onToggleFavorite={toggleFavorite}
            onSelect={() => openLightbox(index)}
            handleDownload={handleDownload}
            isInCart={isInCart(photo.id)}
            onAddToCart={(p: any) => {
              addToCart({
                id: p.id,
                url: p.full_res_url,
                price: event.photo_price || 15.00,
                eventId: event.id,
                eventTitle: event.title
              });
              showToast("✨ Foto adicionada ao carrinho!");
            }}
            isPaid={event.is_paid}
          />
        ))}
      </motion.div>

      <div ref={loadMoreRef} style={{ height: '100px', width: '100%' }} />

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
                className={`${styles.actionBtn} ${displayPhotos[selectedIndex] && favorites.includes(displayPhotos[selectedIndex].id) ? styles.favorited : ''}`}
                onClick={(e) => { 
                  e.stopPropagation(); 
                  toggleFavorite(displayPhotos[selectedIndex].id); 
                }}
              >
                <Heart size={22} fill={displayPhotos[selectedIndex] && favorites.includes(displayPhotos[selectedIndex]?.id) ? "currentColor" : "none"} />
              </button>
              <button 
                className={styles.actionBtn} 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  if (displayPhotos[selectedIndex]) handleShare(displayPhotos[selectedIndex]); 
                }}
              >
                <Share2 size={22} />
              </button>
              <button 
                className={styles.actionBtn} 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  if (displayPhotos[selectedIndex]) handleDownload(displayPhotos[selectedIndex]); 
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
              {displayPhotos[selectedIndex] && (
                <motion.div 
                  className={styles.lightboxImageContainer}
                  animate={{ 
                    scale: isZooming ? 1.4 : 1,
                    originX: focalPoint.x / 100,
                    originY: focalPoint.y / 100
                  }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 40, 
                    damping: 15,
                    delay: 0.2
                  }}
                >
                  <Image 
                    ref={imgRef}
                    src={displayPhotos[selectedIndex].thumbnail_url} 
                    alt="Ampliada" 
                    className={styles.lightboxImage}
                    fill
                    unoptimized={true}
                    style={{ objectFit: 'contain' }}
                    priority
                    onContextMenu={(e) => e.preventDefault()}
                    onDragStart={(e) => e.preventDefault()}
                  />
                </motion.div>
              )}

                {/* --- PRELOAD INVISÍVEL (CARREGA A PRÓXIMA FOTO NO FUNDO) --- */}
                {selectedIndex < displayPhotos.length - 1 && (
                  <Image 
                    src={displayPhotos[selectedIndex + 1].thumbnail_url} 
                    alt="Preload Next" 
                    fill 
                    unoptimized={true} 
                    style={{ opacity: 0, pointerEvents: 'none' }} 
                  />
                )}
                {selectedIndex > 0 && (
                  <Image 
                    src={displayPhotos[selectedIndex - 1].thumbnail_url} 
                    alt="Preload Prev" 
                    fill 
                    unoptimized={true} 
                    style={{ opacity: 0, pointerEvents: 'none' }} 
                  />
                )}

              </motion.div>
              {event.is_paid && <WatermarkGrid opacity={0.3} />}
              <div className={styles.photoCounter}>
                <span>{selectedIndex + 1}</span> / {displayPhotos.length}
              </div>

            {selectedIndex < displayPhotos.length - 1 && (
              <button className={`${styles.navBtn} ${styles.nextBtn}`} onClick={(e) => { e.stopPropagation(); handleNext(); }}>
                <ChevronRight size={40} />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <CheckoutModal 
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        items={items}
        total={total}
        savings={items.length > 0 ? (items.length * 10) - total : 0} 
        originalTotal={items.length * 10}
        onRemove={removeFromCart}
        onSuccess={() => {
          clearCart();
          showToast("💳 Compra simulada com sucesso! Carrinho limpo.");
        }}
      />

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

      {(!allPhotos || allPhotos.length === 0) && (
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
