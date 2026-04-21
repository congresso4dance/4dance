"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import styles from "./ShinyButton.module.css";

interface ShinyButtonProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export default function ShinyButton({ href, children, className }: ShinyButtonProps) {
  return (
    <Link href={href} className={`${styles.wrapper} ${className}`}>
      <motion.div 
        className={styles.button}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Shimmer Effect */}
        <div className={styles.shimmer} />
        
        {/* Glow Effect */}
        <div className={styles.glow} />
        
        <span className={styles.text}>{children}</span>
      </motion.div>
    </Link>
  );
}
