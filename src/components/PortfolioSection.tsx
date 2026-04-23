"use client";

import { motion } from "framer-motion";
import { Camera, ShieldCheck, Zap, Globe, UserCheck, Lock } from "lucide-react";
import styles from "./PortfolioSection.module.css";

const categories = [
  {
    id: 'dance',
    title: 'Dança de Salão',
    description: 'A essência do movimento em festivais e competições.',
    image: '/images/category-dance.jpg'
  },
  {
    id: 'events',
    title: 'Eventos Corporativos',
    description: 'Profissionalismo e elegância para o seu negócio.',
    image: '/images/category-events.jpg'
  },
  {
    id: 'portraits',
    title: 'Ensaios Individuais',
    description: 'Expressão e identidade capturadas com sensibilidade.',
    image: '/images/category-portraits.jpg'
  }
];

export default function PortfolioSection() {
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
          {categories.map((category) => (
            <motion.div
              key={category.id}
              className={styles.card}
              variants={itemVariants}
              whileHover={{ y: -10 }}
            >
              <div className={styles.imageWrapper}>
                {/* Placeholder for images */}
                <div className={styles.placeholder} />
                <div className={styles.overlay}>
                  <h3>{category.title}</h3>
                  <p>{category.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
