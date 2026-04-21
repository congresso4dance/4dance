"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import styles from "./TracingButton.module.css";

interface TracingButtonProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export default function TracingButton({ href, children, className }: TracingButtonProps) {
  return (
    <Link href={href} className={`${styles.wrapper} ${className}`}>
      <motion.div 
        className={styles.button}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
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
