import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import styles from './contrate.module.css';

export const metadata = {
  title: 'Contrate a 4Dance | Cobertura Profissional de Eventos',
  description: 'Leve a 4Dance para o seu palco ou baile. Solicite um orçamento personalizado para a cobertura fotográfica do seu festival ou baile.',
};

export default function ContratePage() {
  const whatsappNumber = "5561993574377";
  const message = (plan: string) => `Olá! Gostaria de saber mais sobre o plano ${plan} da 4Dance.`;
  const getWaLink = (plan: string) => `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message(plan))}`;

  const plans = [
    {
      name: "Fotografia",
      price: "Elite Visual",
      features: [
        "Mínimo de 2 Fotógrafos na cobertura",
        "Seleção de Elite (Agnaldo Araujo)",
        "Reconhecimento Facial Ativo",
        "Entrega Expressa (24h)",
        "Galeria Premium Vitalícia"
      ]
    },
    {
      name: "Vídeos",
      price: "Impacto Cinema",
      features: [
        "Gravação de Demos Profissionais",
        "Aftermovie Oficial do Evento",
        "Reels Dinâmicos p/ Instagram",
        "Chamadas de Vídeo Promocionais",
        "Social Media Kit Exclusivo"
      ]
    },
    {
      name: "Divulgação",
      price: "Especialista",
      features: [
        "Cobertura Live (Gih Rodrigues)",
        "Apresentação (Agnaldo Araujo)",
        "Entrevistas com Artistas/Público",
        "Estratégia de Marketing e Alcance",
        "Engajamento Real na Comunidade"
      ]
    }
  ];

  return (
    <main className={styles.main}>
      <Navbar />

      <header className={styles.hero}>
        <div className={styles.container}>
          <h1>Dê ao seu evento o registro que ele merece.</h1>
          <p>Escolha o nível de excelência que sua marca e seus convidados exigem.</p>
        </div>
      </header>

      <section className={styles.pricing}>
        <div className={styles.container}>
          <div className={styles.grid}>
            {plans.map((plan) => (
              <div key={plan.name} className={styles.card}>
                <h3>{plan.name}</h3>
                <div className={styles.price}>{plan.price}</div>
                <ul className={styles.features}>
                  {plan.features.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
                <a 
                  href={getWaLink(plan.name)} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={styles.whatsappBtn}
                >
                  Solicitar Orçamento
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
