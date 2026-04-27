"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import styles from './error.module.css';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an analytics service or audit log
    console.error("Global Error Captured:", error);
  }, [error]);

  return (
    <div className={styles.container}>
      <div className={styles.background}></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={styles.card}
      >
        <div className={styles.iconBox}>
          <AlertTriangle size={48} color="#ef4444" />
        </div>
        
        <h1 className={styles.title}>Ops! Algo desafinou.</h1>
        <p className={styles.description}>
          Ocorreu um erro inesperado no processamento. Nossa equipe técnica já foi notificada silenciosamente.
        </p>

        {error.digest && (
          <code className={styles.errorCode}>ID do Erro: {error.digest}</code>
        )}

        <div className={styles.actions}>
          <button onClick={() => reset()} className={styles.primaryButton}>
            <RefreshCcw size={18} />
            Tentar Novamente
          </button>
          <Link href="/" className={styles.secondaryButton}>
            <Home size={18} />
            Voltar ao Início
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
