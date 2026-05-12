"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import styles from "./PortfolioSection.module.css";

interface PortfolioEvent {
  id: string;
  cover_url?: string;
  title: string;
  slug?: string;
}

interface PortfolioSectionProps {
  events: PortfolioEvent[];
}

export default function PortfolioSection({ events }: PortfolioSectionProps) {
  // ... (keep variants)
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1] as const
      },
    },
  };

  const displayEvents = Array.isArray(events) ? events.slice(0, 6) : [];

  return (
    <section className={styles.section} id="portfolio">
      <div className={styles.container}>
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <span className={styles.label}>Nossa Expertise</span>
          <h2 className={styles.title}>Portfólio de Elite</h2>
          <p className={styles.description}>
            Explore nossas principais vertentes de atuação e descubra como transformamos cada clique em uma obra prima.
          </p>
        </motion.div>

        <motion.div
          className={styles.grid}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {displayEvents.map((event) => (
            <motion.div
              key={event.id}
              className={styles.portfolioItem}
              variants={itemVariants}
            >
              <Link href={`/eventos/${event.slug || event.id}`} className={styles.link}>
                <div className={styles.imageWrapper}>
                  {event.cover_url ? (
                    <img 
                      src={event.cover_url} 
                      alt={event.title} 
                      className={styles.image} 
                      loading="lazy"
                    />
                  ) : (
                    <div className={styles.placeholder} />
                  )}
                  <div className={styles.overlay}>
                    <h3>{event.title}</h3>
                    <span className={styles.viewMore}>Ver Galeria</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
