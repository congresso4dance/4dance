"use client";

import { motion } from "framer-motion";
import styles from "./PortfolioSection.module.css";
import FloatingCard from "./FloatingCard";
import { useMotionValue, useSpring } from "framer-motion";

interface Event {
  id: string;
  cover_url?: string;
  title: string;
}

interface PortfolioSectionProps {
  events: Event[];
}

export default function PortfolioSection({ events }: PortfolioSectionProps) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

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
      },
    },
  };

  const displayEvents = events.slice(0, 6);

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
          {displayEvents.map((event, index) => (
            <motion.div
              key={event.id}
              className={styles.card}
              variants={itemVariants}
            >
              {event.cover_url && (
                <div className={styles.imageWrapper}>
                  <img src={event.cover_url} alt={event.title} className={styles.image} />
                  <div className={styles.overlay}>
                    <h3>{event.title}</h3>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
