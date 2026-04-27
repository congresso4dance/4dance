"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Camera, Home, ArrowLeft, Search } from 'lucide-react';
import styles from './not-found.module.css';

export default function NotFound() {
  return (
    <div className={styles.container}>
      <div className={styles.background}>
        <div className={styles.blob}></div>
        <div className={styles.blob}></div>
        <div className={styles.blob}></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={styles.content}
      >
        <div className={styles.iconWrapper}>
          <motion.div
            animate={{ 
              rotate: [0, -10, 10, -10, 0],
              scale: [1, 1.1, 1, 1.1, 1]
            }}
            transition={{ repeat: Infinity, duration: 5 }}
          >
            <Camera size={80} className={styles.icon} />
          </motion.div>
          <div className={styles.flash}></div>
        </div>

        <h1 className={styles.title}>404</h1>
        <h2 className={styles.subtitle}>Flash fora de foco!</h2>
        <p className={styles.description}>
          Parece que essa coreografia não existe ou a página mudou de palco. 
          Não deixe o ritmo parar, volte para o início.
        </p>

        <div className={styles.actions}>
          <Link href="/" className={styles.primaryButton}>
            <Home size={20} />
            Voltar para o Início
          </Link>
          <button 
            onClick={() => window.history.back()} 
            className={styles.secondaryButton}
          >
            <ArrowLeft size={20} />
            Voltar Anterior
          </button>
        </div>

        <div className={styles.searchSuggestion}>
          <p>Procurando suas fotos?</p>
          <Link href="/eventos">
            Ver Eventos Ativos <Search size={16} />
          </Link>
        </div>
      </motion.div>

      <footer className={styles.footer}>
        &copy; {new Date().getFullYear()} 4Dance. Todos os direitos reservados.
      </footer>
    </div>
  );
}
