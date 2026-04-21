"use client";

import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './Hero.module.css';
import FloatingCard from './FloatingCard';
import ShinyButton from './ShinyButton';
import TracingButton from './TracingButton';

interface Event {
  id: string;
  cover_url?: string;
  title: string;
}

interface HeroProps {
  events: Event[];
}

export default function Hero({ events }: HeroProps) {
  const [heroPhotos, setHeroPhotos] = useState<Event[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse Tracking Values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for magnetic feel
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  useEffect(() => {
    if (events && events.length > 0) {
      // Pick 8 random photos from the pool
      const shuffled = [...events].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 8);
      setHeroPhotos(selected);
    }
  }, [events]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    
    // Normalize mouse position (-0.5 to 0.5)
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // Predefined grid positions with VARIED SIZES and MORE SPREAD (matching print)
  const positions = [
    { top: '-10%', left: '35%', mouseFactor: 40, rotation: -8, width: '280px' }, // Top vertical
    { top: '5%', right: '5%', mouseFactor: -60, rotation: 12, width: '320px' },  // Top right large
    { top: '35%', left: '15%', mouseFactor: 80, rotation: -12, width: '300px' }, // Mid left
    { top: '45%', right: '15%', mouseFactor: -30, rotation: 15, width: '220px' }, // Mid right small
    { bottom: '-10%', left: '20%', mouseFactor: 70, rotation: 5, width: '250px' }, // Bottom left
    { bottom: '5%', right: '10%', mouseFactor: -40, rotation: -10, width: '280px' }, // Bottom right
    { top: '15%', left: '60%', mouseFactor: 50, rotation: 8, width: '180px' },  // Top inner small
    { bottom: '25%', right: '35%', mouseFactor: -55, rotation: -15, width: '200px' }, // Bottom inner
  ];

  return (
    <section 
      className={styles.hero} 
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      ref={containerRef}
    >
      <div className={styles.splitLayout}>
        
        {/* Left Side: Solid Content Stage */}
        <div className={styles.textContent}>
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className={styles.innerContent}
          >
            <h1 className={styles.title}>
              REGISTRAMOS A <span className={styles.highlight}>ENERGIA</span> DA DANÇA
            </h1>
            <p className={styles.subtitle}>
              Transformamos cada evento em uma experiência visual onde você encontra suas fotos de forma simples e profissional.
            </p>
            
            <div className={styles.actions}>
              <ShinyButton href="/eventos">
                Encontre suas fotos
              </ShinyButton>
              
              <TracingButton href="/contrate">
                Contrate a 4Dance
              </TracingButton>
            </div>
          </motion.div>
        </div>

        {/* Right Side: Interactive Photo Stage */}
        <div className={styles.photoStage}>
          <div className={styles.backgroundGrid}>
            {heroPhotos.map((photo, i) => (
              photo.cover_url && (
                <FloatingCard 
                  key={photo.id}
                  src={photo.cover_url}
                  index={i}
                  mouseX={springX}
                  mouseY={springY}
                  mouseFactor={positions[i % positions.length].mouseFactor}
                  rotation={positions[i % positions.length].rotation}
                  style={{
                    position: 'absolute',
                    width: positions[i % positions.length].width,
                    ...positions[i % positions.length]
                  }}
                />
              )
            ))}
          </div>
          <div className={styles.heroVignette} />
        </div>

      </div>
    </section>
  );
}
