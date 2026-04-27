"use client";

import { motion, useScroll, useSpring } from "framer-motion";
import { useRef } from "react";
import styles from "./TimelineSection.module.css";

const steps = [
  {
    number: "01",
    title: "Vá até o evento",
    description: "Curta seu evento de dança favorito. Nossos fotógrafos estarão registrando cada movimento especial."
  },
  {
    number: "02",
    title: "Encontre suas fotos",
    description: "Suba uma selfie no nosso sistema. Nossa IA de reconhecimento facial encontrará todas as suas fotos em segundos."
  },
  {
    number: "03",
    title: "Compre e receba na hora",
    description: "Escolha suas preferidas, pague via PIX ou cartão e receba o download em alta resolução imediatamente."
  }
];

export default function TimelineSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <section className={styles.section} id="sobre" ref={containerRef}>
      <div className={styles.container}>
        <motion.div 
          className={styles.header}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <span className={styles.label}>Passo a Passo</span>
          <h2>Como funciona a 4Dance?</h2>
          <p>Siga estes 3 passos simples para ter suas memórias eternizadas.</p>
        </motion.div>

        <div className={styles.timelineWrapper}>
          {/* Dynamic Progress Line */}
          <div className={styles.lineTrack}>
            <motion.div 
              className={styles.lineProgress} 
              style={{ scaleY, originY: 0 }}
            />
          </div>

          <div className={styles.timeline}>
            {steps.map((step, index) => (
              <motion.div 
                key={index} 
                className={styles.item}
                initial={{ opacity: 0, x: index % 2 === 0 ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: index * 0.15 }}
              >
                <div className={styles.dot} />
                <span className={styles.year}>{step.number}</span>
                <div className={styles.content}>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
