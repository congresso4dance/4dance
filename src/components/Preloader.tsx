"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import styles from "./Preloader.module.css";

export default function Preloader() {
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setComplete(true);
    }, 2500); // Cinematic delay

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {!complete && (
        <motion.div
          className={styles.preloader}
          initial={{ opacity: 1 }}
          exit={{ 
            y: "-100%",
            transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] }
          }}
        >
          <motion.div 
            className={styles.logoContainer}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
          >
            <Image 
              src="/logo/Logo l 4dance_BRANCA.png" 
              alt="4Dance" 
              width={220} 
              height={110} 
              style={{ width: '220px', height: 'auto', objectFit: 'contain' }}
              priority 
            />
          </motion.div>

          <div className={styles.bar}>
            <motion.div 
              className={styles.progress}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
          </div>

          <motion.span 
            className={styles.text}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Memórias em Movimento
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
