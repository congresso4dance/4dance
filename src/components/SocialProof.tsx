"use client";

import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import styles from "./SocialProof.module.css";

function TestimonialAvatar({ author, url }: { author: string; url?: string | null }) {
  const [error, setError] = useState(false);
  const initials = author.charAt(0).toUpperCase();
  
  if (url && !error) {
    return (
      <div className={styles.avatarContainer}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={url} 
          alt={author} 
          className={styles.avatarImage} 
          onError={() => setError(true)}
        />
      </div>
    );
  }

  return (
    <div className={`${styles.avatarContainer} ${styles.fallbackAvatar}`}>
      {initials}
    </div>
  );
}

interface Testimonial {
  id: string;
  author: string;
  role: string | null;
  content: string;
  avatar_url?: string | null;
}


interface SocialProofProps {
  testimonials: Testimonial[];
}

export default function SocialProof({ testimonials }: SocialProofProps) {
  if (testimonials.length === 0) {
    return null;
  }

  const mid = Math.ceil(testimonials.length / 2);
  const row1 = testimonials.slice(0, mid);
  const row2 = testimonials.slice(mid);
  // Duplicate for seamless infinite scroll; pad with at least 3 items per row
  const allTestimonials1 = row1.length > 0 ? [...row1, ...row1, ...row1] : [];
  const allTestimonials2 = row2.length > 0 ? [...row2, ...row2, ...row2] : [];

  const marqueeVariantsLeft: Variants = {
    animate: {
      x: [0, -2000],
      transition: {
        x: {
          repeat: Infinity,
          repeatType: "loop",
          duration: 40,
          ease: "linear",
        },
      },
    },
  };

  const marqueeVariantsRight: Variants = {
    animate: {
      x: [-2000, 0],
      transition: {
        x: {
          repeat: Infinity,
          repeatType: "loop",
          duration: 45,
          ease: "linear",
        },
      },
    },
  };

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <motion.div 
          className={styles.header}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span>Wall of Love</span>
          <h2>A Voz de Quem Confia</h2>
        </motion.div>
      </div>

      <div className={styles.marqueeContainer}>
        {/* Row 1: To Left */}
        <div className={styles.marqueeWrapper}>
          <motion.div 
            className={styles.marqueeTrack}
            variants={marqueeVariantsLeft}
            animate="animate"
          >
            {allTestimonials1.map((t, index) => (
              <div key={`${t.id}-${index}`} className={styles.testimonialCard}>
                <p className={styles.content}>&quot;{t.content}&quot;</p>
                <div className={styles.author}>
                  <TestimonialAvatar author={t.author || ""} url={t.avatar_url} />
                  <div className={styles.info}>
                    <h4>{t.author}</h4>
                    {t.role && <span>{t.role}</span>}
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Row 2: To Right */}
        <div className={styles.marqueeWrapper}>
          <motion.div 
            className={styles.marqueeTrack}
            variants={marqueeVariantsRight}
            animate="animate"
          >
            {allTestimonials2.map((t, index) => (
              <div key={`${t.id}-${index}`} className={styles.testimonialCard}>
                <p className={styles.content}>&quot;{t.content}&quot;</p>
                <div className={styles.author}>
                  <TestimonialAvatar author={t.author || ""} url={t.avatar_url} />
                  <div className={styles.info}>
                    <h4>{t.author}</h4>
                    {t.role && <span>{t.role}</span>}
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
