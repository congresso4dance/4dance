"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect } from "react";
import { useMagnetic } from "@/hooks/useMagnetic";
import styles from "./ShinyButton.module.css";

interface ShinyButtonProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export default function ShinyButton({ href, children, className }: ShinyButtonProps) {
  const { ref, position, handleMouseMove, handleMouseLeave } = useMagnetic(0.3);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  return (
    <Link href={href} className={`${styles.wrapper} ${className}`}>
      <motion.div 
        ref={ref}
        className={styles.button}
        animate={{ x: position.x, y: position.y }}
        transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onMouseLeave={handleMouseLeave}
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
