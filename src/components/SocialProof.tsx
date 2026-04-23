"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import styles from "./SocialProof.module.css";

function TestimonialAvatar({ author, url }: { author: string, url?: string }) {
  const [error, setError] = useState(false);
  const initials = author.charAt(0).toUpperCase();
  
  if (url && !error) {
    return (
      <div className={styles.avatarContainer}>
        <img 
          src={url} 
          alt={author} 
          className={styles.avatarImage} 
          onError={() => setError(true)}
        />
      </div>
    );
  }

  return (
    <div className={`${styles.avatarContainer} ${styles.fallbackAvatar}`}>
      {initials}
    </div>
  );
}

interface Testimonial {
  id: string;
  author: string;
  role: string;
  content: string;
  avatar_url?: string;
}

const TESTIMONIALS_1 = [
  { id: '1', author: 'Adriano Tavares', role: 'Elite Social', content: 'A 4Dance captura não apenas o passo, mas a alma de cada movimento. É arte em forma de clique.' },
  { id: '2', author: 'Felipe Nascimento', role: 'Articulador de Momentos', content: 'Precisão técnica absoluta. Ver o trabalho final deles é reviver a emoção do baile em alta definição.' },
  { id: '3', author: 'Rodrigo Vitorio', role: 'Mestre do Rítmo', content: 'Incrível como conseguem antecipar o ápice da dança. É um olhar que entende de música e movimento.' },
  { id: '4', author: 'Fabricio Stefano', role: 'Visão Artística', content: 'O nível de detalhe e a entrega rápida mudaram nossa percepção sobre fotografia de eventos.' },
  { id: '5', author: 'Vanessa Belucco', role: 'Dançarina Profissional', content: 'Cada foto é um presente. Eles registram a liberdade que a gente sente na pista com perfeição.' },
  { id: '6', author: 'Zouk Hour', role: 'Congresso Parceiro', content: 'Parceria essencial. O portal 4Dance facilita o acesso dos alunos às memórias do nosso evento.' },
  { id: '7', author: 'Paulo Humberto', role: 'Líder Criativo', content: 'Inovação e arte. A 4Dance é indispensável para quem busca excelência visual no mundo da dança.' },
  { id: '8', author: 'Caio Noronha', role: 'Registro Histórico', content: 'O legado que eles constroem em cada festival é algo que o tempo só valoriza. Impecável.' },
  { id: '9', author: 'Zouk Essence', role: 'Organização de Elite', content: 'Eficiência e profissionalismo. A entrega das fotos em tempo recorde é um diferencial absurdo.' },
  { id: '10', author: 'Amanda', role: 'Estrela da Pista', content: 'Parece que as fotos têm som. Dá pra sentir a vibração da música em cada registro.' },
];

const TESTIMONIALS_2 = [
  { id: '11', author: 'Matheus Vaz', role: 'Tech & Future', content: 'O uso de IA e reconhecimento facial no portal 4Dance é o futuro da fotografia de eventos.' },
  { id: '12', author: 'Thiago Sebba', role: 'Visão Digital', content: 'Fluidez e segurança. O portal é intuitivo e as fotos são de uma qualidade técnica insuperável.' },
  { id: '13', author: 'Israel Szerman', role: 'Estrategista Visual', content: 'Mais que fotos, eles entregam autoridade visual para o festival. É um investimento necessário.' },
  { id: '14', author: 'Brasilia Tango Festival', role: 'Evento Internacional', content: 'Uma honra ter a 4Dance registrando nosso festival. O olhar deles é único no mundo.' },
  { id: '15', author: 'Marcelo Amorim', role: 'Diretor de Festival', content: 'A gestão total de álbuns e o suporte prioritário tornam a 4Dance nossa escolha número 1.' },
  { id: '16', author: 'Cris Ispilicute', role: 'Influenciadora de Dança', content: 'Fazer parte dessa história é maravilhoso. A 4Dance transforma cada evento em um espetáculo.' },
  { id: '17', author: 'Planet', role: 'Parceiro Estratégico', content: 'Impacto visual imbatível. As fotos da 4Dance são a melhor propaganda que um evento pode ter.' },
  { id: '18', author: 'ForZOUK', role: 'Movimento Cultural', content: 'Sempre presentes nos momentos certos. A 4Dance entende a essência da nossa cultura.' },
  { id: '19', author: 'Ze do Lago', role: 'Mentor de Dança', content: 'A técnica deles é refinada. Capturam a conexão entre o par de uma forma que poucos conseguem.' },
  { id: '20', author: 'Ana Elisa', role: 'Curadoria de Imagem', content: 'A seleção das fotos é impecável. Eles sabem exatamente quais cliques vão emocionar.' },
];

interface SocialProofProps {
  testimonials: Testimonial[];
}

export default function SocialProof({ testimonials }: SocialProofProps) {
  // Combine props with static data for a massive wall
  const allTestimonials1 = [...testimonials, ...TESTIMONIALS_1, ...TESTIMONIALS_1]; // Double for seamless loop
  const allTestimonials2 = [...TESTIMONIALS_2, ...TESTIMONIALS_2]; // Double for seamless loop

  const marqueeVariantsLeft = {
    animate: {
      x: [0, -2000],
      transition: {
        x: {
          repeat: Infinity,
          repeatType: "loop", as const
          duration: 40,
          ease: "linear", as const
        },
      },
    },
  };

  const marqueeVariantsRight = {
    animate: {
      x: [-2000, 0],
      transition: {
        x: {
          repeat: Infinity,
          repeatType: "loop", as const
          duration: 45,
          ease: "linear", as const
        },
      },
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
          transition={{ duration: 0.6 }}
        >
          <span>Wall of Love</span>
          <h2>A Voz de Quem Confia</h2>
        </motion.div>
      </div>

      <div className={styles.marqueeContainer}>
        {/* Row 1: To Left */}
        <div className={styles.marqueeWrapper}>
          <motion.div 
            className={styles.marqueeTrack}
            variants={marqueeVariantsLeft}
            animate="animate"
          >
            {allTestimonials1.map((t, index) => (
              <div key={`${t.id}-${index}`} className={styles.testimonialCard}>
                <p className={styles.content}>"{t.content}"</p>
                <div className={styles.author}>
                  <TestimonialAvatar author={t.author || ""} url={t.avatar_url} />
                  <div className={styles.info}>
                    <h4>{t.author}</h4>
                    <span>{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Row 2: To Right */}
        <div className={styles.marqueeWrapper}>
          <motion.div 
            className={styles.marqueeTrack}
            variants={marqueeVariantsRight}
            animate="animate"
          >
            {allTestimonials2.map((t, index) => (
              <div key={`${t.id}-${index}`} className={styles.testimonialCard}>
                <p className={styles.content}>"{t.content}"</p>
                <div className={styles.author}>
                  <TestimonialAvatar author={t.author || ""} url={t.avatar_url} />
                  <div className={styles.info}>
                    <h4>{t.author}</h4>
                    <span>{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
