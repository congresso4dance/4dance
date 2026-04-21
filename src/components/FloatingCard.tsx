"use client";

import { motion, useScroll, useTransform, MotionValue } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";
import styles from "./Hero.module.css";

interface FloatingCardProps {
  src: string;
  index: number;
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  mouseFactor?: number;
  rotation?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function FloatingCard({ 
  src, 
  index, 
  mouseX, 
  mouseY, 
  mouseFactor = 40,
  rotation = 0,
  className, 
  style 
}: FloatingCardProps) {
  const ref = useRef(null);
  
  // Magnetic movement based on mouse
  const x = useTransform(mouseX, [-0.5, 0.5], [mouseFactor * -1.2, mouseFactor * 1.2]);
  const yMouse = useTransform(mouseY, [-0.5, 0.5], [mouseFactor * -1.2, mouseFactor * 1.2]);

  // Parallax based on page scroll
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const yScroll = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  return (
    <motion.div
      ref={ref}
      style={{ 
        ...style, 
        x, 
        y: yMouse, // Combined y would be harder, using mouse y for now as priority
        opacity,
        rotate: rotation
      }}
      className={`${styles.floatingCard} ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        delay: index * 0.1, 
        duration: 1, 
        ease: [0.16, 1, 0.3, 1] 
      }}
    >
      <div className={styles.cardInner}>
        <Image 
          src={src} 
          alt="4Dance Moment" 
          fill
          sizes="(max-width: 768px) 150px, 300px"
          className={styles.heroImg}
          unoptimized={src.includes('.gif') || src.includes('supabase')}
        />
        <div className={styles.cardOverlay} />
      </div>
    </motion.div>
  );
}
