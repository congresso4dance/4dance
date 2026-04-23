"use client";

import { motion, useScroll, useSpring } from "framer-motion";
import { useRef } from "react";
import styles from "./TimelineSection.module.css";

const steps = [
  {
    year: "2017",
    title: "O Primeiro Flash",
    description: "Nascimento da 4Dance com o propósito de levar fotografia profissional para as pistas de dança, onde cada movimento importa."
  },
  {
    year: "2020",
    title: "Expansão Nacional",
    description: "Cobertura dos maiores festivais do Brasil, consolidando um estilo vibrante e técnico que se tornou referência no mercado."
  },
  {
    year: "2022",
    title: "Padrão de Excelência",
    description: "Implementação de processos de seleção de elite e entrega ultra-rápida, elevando a experiêcia do cliente final."
  },
  {
    year: "2024",
    title: "Tecnologia & Futuro",
    description: "Lançamento do Portal 4Dance, unindo arte e tecnologia para facilitar o acesso às memórias mais preciosas."
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
          <span className={styles.label}>Nossa História</span>
          <h2>A Jornada do Olhar</h2>
          <p>Transformando momentos efêmeros em legados visuais desde o primeiro click.</p>
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
                <span className={styles.year}>{step.year}</span>
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
