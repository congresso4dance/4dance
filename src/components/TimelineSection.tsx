"use client";

import { motion } from "framer-motion";
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
    description: "Implementação de processos de seleção de elite e entrega ultra-rápida, elevando a experiência do cliente final."
  },
  {
    year: "2024",
    title: "Tecnologia & Futuro",
    description: "Lançamento do Portal 4Dance, unindo arte e tecnologia para facilitar o acesso às memórias mais preciosas."
  }
];

export default function TimelineSection() {
  return (
    <section className={styles.section} id="sobre">
      <div className={styles.container}>
        <motion.div 
          className={styles.header}
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2>Nossa Jornada</h2>
          <p>Transformando momentos efêmeros em legados visuais.</p>
        </motion.div>

        <div className={styles.timeline}>
          {steps.map((step, index) => (
            <motion.div 
              key={index} 
              className={styles.item}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: index * 0.1 }}
            >
              <span className={styles.year}>{step.year}</span>
              <div className={styles.content}>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
