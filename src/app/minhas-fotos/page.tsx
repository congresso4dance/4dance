"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Search, Sparkles, Download, ShoppingBag, LayoutGrid, Heart, User, LogOut, Loader2, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as faceapi from 'face-api.js';
import styles from './portal.module.css';
import WatermarkGrid from '@/components/WatermarkGrid';
import { useCart } from '@/hooks/useCart';

export default function MinhasFotosPortal() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [referenceFace, setReferenceFace] = useState<any>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const { addToCart, isInCart } = useCart();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function init() {
      // 1. Check Auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      // 2. Load Profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setProfile(profile);

      // 3. Load Models
      await loadModels();
      setLoading(false);
    }
    init();
  }, []);

  async function loadModels() {
    const MODEL_URL = '/models';
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ]);
      setModelsLoaded(true);
    } catch (err) {
      console.error("Erro ao carregar modelos:", err);
    }
  }

  const handleSelfieUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !modelsLoaded) return;

    setSearching(true);
    try {
      const img = await faceapi.bufferToImage(file);
      const detection = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        alert("Não conseguimos detectar seu rosto. Tente uma foto mais clara!");
        setSearching(false);
        return;
      }

      // 1. Vector Search across ALL events (Global Search)
      const embeddingString = `[${Array.from(detection.descriptor).join(',')}]`;
      const { data: matchData, error: matchError } = await supabase.rpc('match_photo_faces', {
        query_embedding: embeddingString,
        match_threshold: 0.8, // Mais permissivo para Recall global
        match_count: 50
      });

      if (matchError) throw matchError;

      if (!matchData || matchData.length === 0) {
        alert("Nenhuma foto encontrada ainda. Continue dançando e em breve você aparecerá aqui!");
        setPhotos([]);
        setSearching(false);
        return;
      }

      // 2. Local refinement for precision (The one you loved)
      const faceMatcher = new faceapi.FaceMatcher(detection.descriptor, 0.5);
      const matchedPhotoIds: string[] = [];

      matchData.forEach((face: any) => {
        const desc = new Float32Array(JSON.parse(face.embedding));
        const match = faceMatcher.findBestMatch(desc);
        if (match.label !== 'unknown') {
          matchedPhotoIds.push(face.photo_id);
        }
      });

      if (matchedPhotoIds.length === 0) {
        alert("Nenhuma foto certeira encontrada. Tente outra selfie com iluminação diferente!");
        setPhotos([]);
      } else {
        // 3. Fetch Photo Details + Event Data
        const { data: matchedPhotos } = await supabase
          .from('photos')
          .select('*, events(title, is_paid, photo_price)')
          .in('id', matchedPhotoIds);

        setPhotos(matchedPhotos || []);
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao processar busca facial.");
    }
    setSearching(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <Loader2 className="animate-spin" size={48} color="var(--primary)" />
        <p>Preparando seu palco...</p>
      </div>
    );
  }

  return (
    <div className={styles.portalContainer}>
      <nav className={styles.sidebar}>
        <div className={styles.navTop}>
          <div className={styles.logo}>4DANCE <span>CLIENTE</span></div>
          <div className={styles.userProfile}>
            <div className={styles.avatar}>
              <User size={24} />
            </div>
            <div className={styles.userInfo}>
              <strong>{profile?.full_name || user?.email}</strong>
              <span>Dançarino Enthusiast</span>
            </div>
          </div>
        </div>

        <div className={styles.navLinks}>
          <Link href="/minhas-fotos" className={styles.active}>
            <LayoutGrid size={20} /> Minha Galeria
          </Link>
          <Link href="/eventos">
            <Sparkles size={20} /> Descobrir Eventos
          </Link>
          <Link href="/meus-pedidos">
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
            <h1>Minhas Fotos</h1>
            <p>Todas as suas memórias centralizadas em um só lugar.</p>
          </div>
          
          <label className={styles.searchBtn}>
            <input type="file" accept="image/*" onChange={handleSelfieUpload} hidden />
            <Camera size={20} />
            Nova Busca Facial
          </label>
        </header>

        {searching ? (
          <div className={styles.searchingState}>
            <div className={styles.aiPulse}></div>
            <Search size={48} className={styles.searchIcon} />
            <h2>Buscando seu brilho na pista...</h2>
            <p>Analisando milhares de fotos para encontrar as suas.</p>
          </div>
        ) : photos.length > 0 ? (
          <div className={styles.photoGrid}>
            {photos.map((photo) => (
              <motion.div 
                key={photo.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={styles.photoCard}
              >
                <div className={styles.imageBox}>
                  <Image 
                    src={photo.full_res_url} 
                    alt="Sua foto" 
                    fill 
                    style={{ objectFit: 'cover' }}
                    unoptimized 
                  />
                  {photo.events?.is_paid && <WatermarkGrid opacity={0.25} />}
                  
                  <div className={styles.photoOverlay}>
                    <div className={styles.eventLabel}>{photo.events?.title}</div>
                    
                    <div className={styles.cardActions}>
                      {photo.events?.is_paid ? (
                        <button 
                          className={`${styles.actionBtn} ${isInCart(photo.id) ? styles.inCart : ''}`}
                          onClick={() => addToCart({
                            id: photo.id,
                            url: photo.full_res_url,
                            price: photo.events?.photo_price || 15,
                            eventId: photo.event_id,
                            eventTitle: photo.events?.title
                          })}
                        >
                          {isInCart(photo.id) ? <CheckCircle2 size={16} /> : <ShoppingBag size={16} />}
                          <span>{isInCart(photo.id) ? 'No Carrinho' : `R$ ${photo.events?.photo_price}`}</span>
                        </button>
                      ) : (
                        <button className={styles.actionBtn} onClick={() => window.open(photo.full_res_url)}>
                          <Download size={16} /> <span>Baixar Grátis</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <Sparkles size={64} opacity={0.1} />
            <h3>Comece sua jornada</h3>
            <p>Suba uma selfie para que nossa IA encontre suas fotos em todos os nossos eventos.</p>
            <label className={styles.mainSearchBtn}>
              <input type="file" accept="image/*" onChange={handleSelfieUpload} hidden />
              Identificar meu Rosto
            </label>
          </div>
        )}
      </main>
    </div>
  );
}
