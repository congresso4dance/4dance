"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect } from "react";
import { useMagnetic } from "@/hooks/useMagnetic";
import styles from "./TracingButton.module.css";

interface TracingButtonProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export default function TracingButton({ href, children, className }: TracingButtonProps) {
  const { ref, position, handleMouseMove, handleMouseLeave } = useMagnetic(0.2);

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
        {/* The Tracing Border SVG */}
        <div className={styles.borderContainer}>
          <svg className={styles.svg}>
            <rect 
              rx="12" 
              ry="12" 
              className={styles.rect} 
              width="100%" 
              height="100%" 
            />
          </svg>
        </div>
        
        <span className={styles.text}>{children}</span>
      </motion.div>
    </Link>
  );
}
