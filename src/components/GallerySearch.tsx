"use client";

import { useState, useRef, useEffect } from "react";
import { UserSearch, Camera, Upload, CheckCircle2, AlertCircle, X, Sparkles, Search } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { verifyFacesWithAI } from "@/app/actions/ai-verification";
import styles from "./GallerySearch.module.css";
import { motion, AnimatePresence } from "framer-motion";
import * as faceapi from 'face-api.js';
import { trackActivity } from "@/app/actions/crm-actions";

export default function GallerySearch({ photos, eventId, onFilter }: { photos: any[], eventId: string, onFilter: (filteredPhotos: any[] | null) => void }) {
  const [isScanning, setIsScanning] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [referenceDescriptors, setReferenceDescriptors] = useState<Float32Array[]>([]);
  const [referenceImages, setReferenceImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [status, setStatus] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    if (modelsLoaded) return true;
    setStatus("Iniciando motor de IA...");
    const MODEL_URL = `${window.location.origin}/models`;
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ]);
      setModelsLoaded(true);
      return true;
    } catch (err) {
      console.error("Erro ao carregar modelos de IA:", err);
      setStatus("Falha ao carregar IA. Verifique sua conexão.");
      return false;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    
    // Create preview
    const url = URL.createObjectURL(file);
    setPreviewUrls(prev => [...prev, url]);
    setReferenceImages(prev => [...prev, file]);
    
    const loaded = await loadModels();
    if (!loaded) {
      setIsScanning(false);
      return;
    }

    setStatus("Analisando rosto...");

    try {
      const img = await faceapi.bufferToImage(file);
      const detection = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        const newDescriptors = [...referenceDescriptors, detection.descriptor];
        setReferenceDescriptors(newDescriptors);
        setStatus("Rosto identificado! Refinando busca...");
        
        // Sempre busca com todos os rostos atuais
        startGallerySearch(newDescriptors, [...referenceImages, file]);
      } else {
        setStatus("Nenhum rosto encontrado na sua foto. Tente outra!");
        setPreviewUrls(prev => prev.filter(p => p !== url));
        setReferenceImages(prev => prev.filter(f => f !== file));
        setIsScanning(false);
      }
    } catch (err) {
      setStatus("Erro ao processar imagem.");
      setIsScanning(false);
    }
  };

  const startGallerySearch = async (descriptors: Float32Array[], images: File[]) => {
    try {
      setStatus(descriptors.length > 1 ? "Buscando o casal na multidão..." : "Buscando fotos no servidor...");
      
      // 1. Fetch dynamic settings from DB
      const { data: settingsData } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'ai_config')
        .single();
      
      const config = settingsData?.value || { match_threshold: 0.92, gemini_enabled: true, max_search_results: 100 };
      
      let commonPhotoIds: string[] | null = null;

      // Realiza a busca para cada rosto e faz a interseção
      for (const descriptor of descriptors) {
        const embeddingString = `[${Array.from(descriptor).join(',')}]`;
        const { data: matchData, error: matchError } = await supabase.rpc('match_photo_faces', {
          query_embedding: embeddingString,
          match_threshold: config.match_threshold,
          match_count: config.max_search_results,
          p_event_id: eventId // Filtro por evento ativado
        });

        if (matchError) throw matchError;

        const currentIds = matchData.map((m: any) => m.photo_id);
        if (commonPhotoIds === null) {
          commonPhotoIds = currentIds;
        } else {
          // Interseção: Apenas IDs que estão em ambos
          commonPhotoIds = commonPhotoIds.filter(id => currentIds.includes(id));
        }
      }

      let success = false;
      let resultCount = 0;

      if (commonPhotoIds && commonPhotoIds.length > 0) {
        const photoIds = commonPhotoIds;
        const { data: photoData } = await supabase
          .from('photos')
          .select('*')
          .in('id', photoIds);

        if (!photoData || photoData.length === 0) {
          onFilter(null);
          setStatus("Erro ao recuperar fotos para verificação.");
          setIsScanning(false);
          return;
        }

        const currentEventId = photoData[0].event_id;

        // 1.5 Track Activity (IA SEARCH) - Pegamos o email se logado ou associamos depois
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          trackActivity(user.email, 'SCAN', eventId, { 
            results_count: photoIds.length,
            search_type: 'facial'
          });
        }

        // Gemini verificado ou Fallback: Refinamento com a lógica do "Minhas Fotos"
        setStatus("Refinando resultados com precisão Elite... ✨");

        const faceMatcher = new faceapi.FaceMatcher(descriptors[0], 0.5); // Lógica aprovada pelo usuário
        const finalPhotoIds: string[] = [];

        // 2. Local refinement (A mágica que você aprovou no portal)
        const { data: faceData } = await supabase
          .from('photo_faces')
          .select('photo_id, embedding')
          .in('photo_id', photoIds);

        if (faceData) {
          faceData.forEach(face => {
            const desc = new Float32Array(JSON.parse(face.embedding));
            const match = faceMatcher.findBestMatch(desc);
            if (match.label !== 'unknown') {
              finalPhotoIds.push(face.photo_id);
            }
          });
        }

        const uniqueFinalIds = Array.from(new Set(finalPhotoIds));

        if (uniqueFinalIds.length > 0) {
          const finalPhotos = photoData.filter((p: any) => uniqueFinalIds.includes(p.id));
          onFilter(finalPhotos);
          setStatus(`Encontramos ${uniqueFinalIds.length} fotos perfeitas para você! 🔍`);
          success = true;
          resultCount = uniqueFinalIds.length;
        } else {
          // Se o refinamento for severo demais, mostramos o resultado original da busca vetorial
          onFilter(photoData);
          setStatus(`Encontramos ${photoIds.length} fotos similares. 🔍`);
          success = true;
          resultCount = photoIds.length;
        }

        // Log search (async)
        supabase.from('search_logs').insert({
          event_id: currentEventId,
          success: success,
          results_count: resultCount,
          user_agent: navigator.userAgent
        }).then();

      } else {
        onFilter(null);
        setStatus("Nenhuma foto encontrada com base nos seus traços.");
        
        // Log failed search
        supabase.from('search_logs').insert({
          success: false,
          results_count: 0,
          user_agent: navigator.userAgent
        }).then();
      }
    } catch (err) {
      console.error("Search error:", err);
      setStatus("Ocorreu um erro inesperado.");
    } finally {
      setIsScanning(false);
    }
  };

  const clearFilter = () => {
    setReferenceDescriptors([]);
    setReferenceImages([]);
    setPreviewUrls([]);
    setStatus("");
    onFilter(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleTextSearch = (query: string) => {
    if (!query || query.trim() === "") {
      onFilter(null);
      return;
    }
    
    setStatus("");
    const lowerQuery = query.toLowerCase();
    const filtered = photos
      .filter(p => p.full_res_url?.toLowerCase().includes(lowerQuery))
      .map(p => p.id);
    
    onFilter(filtered);
  };

  const cameraInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={styles.wrapper}>
      {/* Input oculto: ENVIAR FOTO do rolo de câmera */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/*" 
        style={{ display: 'none' }} 
      />

      {/* Input oculto: TIRAR SELFIE com câmera frontal */}
      <input 
        type="file" 
        ref={cameraInputRef} 
        onChange={handleFileUpload} 
        accept="image/*" 
        capture="user"
        style={{ display: 'none' }} 
      />

      <div className={styles.intro}>
        <div className={styles.categoryBadge}>IA VISION</div>
        <h2 className={styles.searchTitle}>Busca por Reconhecimento Facial</h2>
        <p className={styles.searchSubtitle}>Encontre suas fotos instantaneamente em meio a milhares.</p>
      </div>

      {referenceDescriptors.length === 0 && (
        <div className={styles.searchMethods}>
          <div className={styles.textSearchWrapper}>
            <Search className={styles.searchIcon} size={18} />
            <input 
              type="text" 
              placeholder="Busque por nome do arquivo (ex: DSC_01)..." 
              className={styles.textInput}
              onChange={(e) => handleTextSearch(e.target.value)}
            />
          </div>

          <div className={styles.divider}>
            <span>OU</span>
          </div>

          <div className={styles.tipsSection}>
            <h4>Busca Inteligente por Face:</h4>
            <ul className={styles.tipsGrid}>
              <li><span>🚫</span> Sem óculos escuros</li>
              <li><span>💡</span> Boa iluminação</li>
              <li><span>📸</span> Olhe para a câmera</li>
            </ul>
          </div>
        </div>
      )}

      <div className={styles.controls}>
        {referenceDescriptors.length > 0 && (
          <div className={styles.selectedFaces}>
            {previewUrls.map((url, i) => (
              <div key={i} className={styles.faceTag}>
                <img src={url} alt="Face" className={styles.faceThumb} />
                {referenceDescriptors.length > 1 && (
                  <button className={styles.removeFace} onClick={() => {
                    const newDescs = [...referenceDescriptors];
                    const newImages = [...referenceImages];
                    const newUrls = [...previewUrls];
                    newDescs.splice(i, 1);
                    newImages.splice(i, 1);
                    newUrls.splice(i, 1);
                    setReferenceDescriptors(newDescs);
                    setReferenceImages(newImages);
                    setPreviewUrls(newUrls);
                    if (newDescs.length > 0) startGallerySearch(newDescs, newImages);
                    else clearFilter();
                  }}><X size={10} /></button>
                )}
              </div>
            ))}
            {referenceDescriptors.length < 2 && (
              <button className={styles.addPartnerBtn} onClick={() => fileInputRef.current?.click()}>
                + Adicionar Parceiro(a)
              </button>
            )}
          </div>
        )}

        {referenceDescriptors.length === 0 ? (
          <div className={styles.dualButtons}>
            <button 
              className={styles.searchBtn} 
              onClick={() => cameraInputRef.current?.click()} 
              disabled={isScanning || !modelsLoaded}
            >
              <Camera size={20} />
              {isScanning ? "Buscando..." : (modelsLoaded ? "Tirar Selfie" : "Carregando IA...")}
            </button>
            <button 
              className={styles.uploadBtn} 
              onClick={() => fileInputRef.current?.click()} 
              disabled={isScanning || !modelsLoaded}
            >
              <Upload size={20} />
              {modelsLoaded ? "Enviar Foto" : "..."}
            </button>
          </div>
        ) : (
          <button className={styles.clearBtn} onClick={clearFilter}>
            <X size={16} /> Limpar Filtro
          </button>
        )}
        
        {status && <span className={styles.statusLabel}>{status}</span>}
      </div>

      <AnimatePresence>
        {isScanning && (
          <motion.div 
            className={styles.scannerOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className={styles.scannerContainer}>
              <div className={styles.scannerHeader}>
                <motion.div 
                  className={styles.aiBadge}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles size={16} /> 4D IA VISION
                </motion.div>
                <h3>{status || "Iniciando Processamento"}</h3>
              </div>

              <div className={styles.imageStage}>
                {previewUrls.length > 0 ? (
                  <div className={styles.previewContainer}>
                    <img src={previewUrls[previewUrls.length - 1]} alt="Scanning" className={styles.previewImage} />
                    <motion.div 
                      className={styles.scanLine}
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    />
                    <div className={styles.scanOverlay} />
                  </div>
                ) : (
                  <div className={styles.imagePlaceholder}>
                    <div className={styles.pulseSquare} />
                  </div>
                )}
              </div>

              <div className={styles.scannerFooter}>
                <div className={styles.loadingSteps}>
                  <div className={styles.step}>
                    <div className={`${styles.dot} ${modelsLoaded ? styles.active : styles.pulse}`} />
                    <span>Rede Neural</span>
                  </div>
                  <div className={styles.step}>
                    <div className={`${styles.dot} ${referenceDescriptors.length > 0 ? styles.active : (modelsLoaded ? styles.pulse : '')}`} />
                    <span>Vetor Facial</span>
                  </div>
                  <div className={styles.step}>
                    <div className={`${styles.dot} ${isScanning && referenceDescriptors.length > 0 ? styles.pulse : ''}`} />
                    <span>Deep Search</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

