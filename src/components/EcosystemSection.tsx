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
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
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
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <span className={styles.label}>Infraestrutura 4D</span>
          <h2 className={styles.title}>O Ecossistema da Excelência</h2>
          <p>Unimos sensibilidade artística e tecnologia de ponta para criar um ambiente digital premium para suas memórias.</p>
        </motion.div>

        <motion.div 
          className={styles.grid}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {features.map((feature, index) => (
            <motion.div 
              key={index} 
              className={styles.feature}
              variants={itemVariants}
              whileHover={{ 
                y: -10, 
                backgroundColor: "rgba(255, 255, 255, 0.04)",
                borderColor: "rgba(255, 0, 115, 0.3)" 
              }}
            >
              <div className={styles.iconWrapper}>
                <div className={styles.iconGlow} />
                <div className={styles.icon}>{feature.icon}</div>
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
