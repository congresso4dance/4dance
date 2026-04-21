"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import styles from "./PortfolioSection.module.css";

interface Event {
  id: string;
  title: string;
  slug: string;
  event_date: string;
  styles?: string[];
  cover_url?: string;
}

interface PortfolioSectionProps {
  events: Event[];
}

export default function PortfolioSection({ events }: PortfolioSectionProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <section className={styles.section} id="portfolio">
      <div className={styles.container}>
        <motion.div 
          className={styles.header}
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span>Eventos Recentes</span>
          <h2>Nossa Visão em Cada Clique</h2>
        </motion.div>

        <motion.div 
          className={styles.grid}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {events.slice(0, 6).map((event) => (
            <motion.div 
              key={event.id} 
              className={styles.portfolioItem}
              variants={itemVariants}
            >
              <Link href={`/eventos/${event.slug}`} className={styles.imageWrapper}>
                <div className={styles.imageContainer}>
                  {event.cover_url ? (
                    <img 
                      src={event.cover_url} 
                      alt={event.title} 
                      className={styles.image}
                      loading="lazy"
                    />
                  ) : (
                    <div className={styles.imagePlaceholder}>
                      <span>{new Date(event.event_date).getFullYear()}</span>
                    </div>
                  )}
                </div>
                <div className={styles.overlay}>
                  <span className={styles.category}>
                    {event.styles?.join(' • ') || 'Evento de Dança'}
                  </span>
                  <h3 className={styles.itemTitle}>{event.title}</h3>
                </div>
              </Link>
            </motion.div>
          ))}
          
          {events.length === 0 && (
            <div style={{ gridColumn: 'span 12', textAlign: 'center', padding: '4rem', opacity: 0.5 }}>
              <p>Obras em desenvolvimento...</p>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
