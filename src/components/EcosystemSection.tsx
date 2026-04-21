"use client";

import { motion } from "framer-motion";
import { Camera, ShieldCheck, Zap, Globe, UserCheck, Lock } from "lucide-react";
import styles from "./EcosystemSection.module.css";

const features = [
  {
    icon: <Camera size={40} />,
    title: "Captura de Elite",
    description: "Equipamento de última geração e olhar artístico treinado para capturar o ápice do movimento e da emoção em cada festival."
  },
  {
    icon: <ShieldCheck size={40} />,
    title: "Seleção de Elite",
    description: "Cada imagem passa por um rigoroso processo de seleção. Não entregamos apenas fotos, entregamos o seu legado visual."
  },
  {
    icon: <Zap size={40} />,
    title: "Entrega Express",
    description: "Sabemos que a emoção tem pressa. Nossos processos são otimizados para garantir a entrega mais rápida do mercado fotográfico."
  },
  {
    icon: <Globe size={40} />,
    title: "Eco Digital",
    description: "Um portal fluido e seguro para acesso instantâneo, permitindo que você compartilhe suas memórias com o mundo em 5G."
  },
  {
    icon: <UserCheck size={40} />,
    title: "Facial Recognition",
    description: "Encontre suas fotos em segundos. Nossa IA de reconhecimento facial vasculha milhares de cliques para achar apenas você."
  },
  {
    icon: <Lock size={40} />,
    title: "Privacidade Total",
    description: "Seus dados e memórias protegidos por criptografia de ponta a ponta. Você tem controle total sobre quem vê suas fotos."
  }
];

export default function EcosystemSection() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <motion.h2 
          className={styles.title}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          O Ecossistema 4Dance
        </motion.h2>

        <div className={styles.grid}>
          {features.map((feature, index) => (
            <motion.div 
              key={index} 
              className={styles.feature}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
            >
              <div className={styles.icon}>{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
