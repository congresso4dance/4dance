"use client";

import { useState, useRef, useEffect } from "react";
import { UserSearch, Camera, Upload, CheckCircle2, AlertCircle, X, Sparkles } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { verifyFacesWithAI } from "@/app/actions/ai-verification";
import styles from "./GallerySearch.module.css";
import { motion, AnimatePresence } from "framer-motion";
import * as faceapi from 'face-api.js';

export default function GallerySearch({ photos, onFilter }: { photos: any[], onFilter: (filteredIds: string[] | null) => void }) {
  const [isScanning, setIsScanning] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [referenceDescriptor, setReferenceDescriptor] = useState<Float32Array | null>(null);
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    if (modelsLoaded) return true;
    setStatus("Iniciando motor de IA...");
    const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
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
    setReferenceImage(file);
    
    const loaded = await loadModels();
    if (!loaded) {
      setIsScanning(false);
      return;
    }

    setStatus("Analisando sua foto...");

    try {
      const img = await faceapi.bufferToImage(file);
      const detection = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        setReferenceDescriptor(detection.descriptor);
        setStatus("Rosto identificado! Iniciando busca na galeria...");
        startGallerySearch(detection.descriptor, file);
      } else {
        setStatus("Nenhum rosto encontrado na sua foto. Tente outra!");
        setIsScanning(false);
      }
    } catch (err) {
      setStatus("Erro ao processar imagem.");
      setIsScanning(false);
    }
  };

  const startGallerySearch = async (descriptor: Float32Array, image: File) => {
    try {
      setStatus("Buscando fotos no servidor...");
      
      // Convert Float32Array to PostgreSQL vector string format: [1, 2, 3...]
      const embeddingString = `[${Array.from(descriptor).join(',')}]`;

      const { data, error } = await supabase.rpc('match_photo_faces', {
        query_embedding: embeddingString,
        match_threshold: 0.80, // Equilíbrio: pega bastante resultado sem muita sujeira
        match_count: 100 // Buscar até 100 candidatas para não perder nenhuma foto
      });

      if (error) {
        console.error("Erro na busca vetorial:", error);
        setStatus("Erro na busca inteligente. Tente novamente.");
        setIsScanning(false);
        return;
      }

      if (data && data.length > 0) {
        // Obter as URLs reais das fotos
        const photoIds = data.map((d: any) => d.photo_id);
        const { data: photoData } = await supabase
          .from('photos')
          .select('id, full_res_url')
          .in('id', photoIds);

        if (!photoData || photoData.length === 0) {
          onFilter(null);
          setStatus("Erro ao recuperar fotos para verificação.");
          setIsScanning(false);
          return;
        }

        // TENTAR verificação com Gemini (IA Generativa)
        try {
          setStatus("Verificando identidade com IA Generativa... 🧐");

          // Ordenar photoData de acordo com a ordem de similaridade
          const candidates = photoIds
            .map(id => photoData.find(p => p.id === id)?.full_res_url)
            .filter(Boolean) as string[];

          // Converter o File da selfie para Base64 para o Gemini
          const referenceBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(image);
          });

          // SEGUNDO PASSO: Verificação de Elite com Gemini
          const aiResult = await verifyFacesWithAI(referenceBase64, candidates);

          if (aiResult.success && aiResult.matches && aiResult.matches.length > 0) {
            // Filtrar apenas as fotos que o Gemini confirmou
            const finalPhotoIds = photoData
              .filter(p => aiResult.matches?.includes(p.full_res_url))
              .map(p => p.id);
              
            onFilter(finalPhotoIds);
            setStatus(`IA Confirmou ${finalPhotoIds.length} fotos suas! ✨`);
          } else if (aiResult.success) {
            // Gemini respondeu mas não achou matches - usar busca vetorial como fallback
            console.warn("[Fallback] Gemini não confirmou nenhum match. Usando busca vetorial.");
            onFilter(photoIds);
            setStatus(`Encontramos ${photoIds.length} fotos similares (busca vetorial). 🔍`);
          } else {
            // Gemini falhou - usar busca vetorial como fallback
            throw new Error(aiResult.error || "AI falhou");
          }
        } catch (aiError) {
          // FALLBACK: Se o Gemini falhar por qualquer motivo, usar a busca vetorial pura
          console.warn("[Fallback] Gemini indisponível. Usando busca vetorial pura:", aiError);
          onFilter(photoIds);
          setStatus(`Encontramos ${photoIds.length} fotos similares (busca inteligente). 🔍`);
        }
      } else {
        onFilter(null);
        setStatus("Nenhuma foto encontrada com base nos seus traços.");
      }
    } catch (err) {
      console.error("Search error:", err);
      setStatus("Ocorreu um erro inesperado.");
    } finally {
      setIsScanning(false);
    }
  };

  const clearFilter = () => {
    setReferenceDescriptor(null);
    setStatus("");
    onFilter(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
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

      <div className={styles.controls}>
        {!referenceDescriptor ? (
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
            <div className={styles.searchHeader}>
              <div className={styles.iconWrapper}>
                {isScanning ? (
                  <motion.div
                    animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className={styles.sparkleIcon} />
                  </motion.div>
                ) : referenceDescriptor ? (
                  <CheckCircle2 className={styles.successIcon} />
                ) : (
                  <UserSearch className={styles.searchIcon} />
                )}
              </div>
              <div className={styles.headerText}>
                <h3>Busca Inteligente</h3>
                <p>{status || "Encontre suas fotos instantaneamente pela sua fisionomia."}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

