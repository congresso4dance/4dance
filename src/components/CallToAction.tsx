"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import styles from "./CallToAction.module.css";
import ShinyButton from "./ShinyButton";
import TracingButton from "./TracingButton";

export default function CallToAction() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <motion.div 
          className={styles.content}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className={styles.tagline}>O Próximo Capítulo</span>
          <h2 className={styles.title}>
            Pronto para eternizar o <br />
            seu próximo evento?
          </h2>
          <p className={styles.description}>
            Junte-se aos maiores festivais do Brasil e ofereça uma experiência 
            visual tecnológica, rápida e emocionante para seus dançarinos.
          </p>

          <div className={styles.actions}>
            <ShinyButton href="/contrate">
              Planejar meu evento
            </ShinyButton>
            
            <TracingButton href="/eventos">
              Ver as galerias
            </TracingButton>
          </div>
        </motion.div>
      </div>
      
      {/* Visual background details */}
      <div className={styles.ambientLight} />
    </section>
  );
}
