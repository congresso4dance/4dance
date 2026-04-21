import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Image from 'next/image';
import styles from './sobre.module.css';

export const metadata = {
  title: 'Sobre a 4Dance | Eternizando a Dança',
  description: 'Conheça a história e a missão da 4Dance, a principal plataforma de fotografia especializada em dança de salão no Brasil.',
};

export default function AboutPage() {
  return (
    <main className={styles.main}>
      <Navbar />

      <header className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <h1 className={styles.primaryTitle}>A 4Dance nasceu dentro da pista.</h1>
          </div>
        </div>
      </header>

      <section className={styles.content}>
        <div className={styles.container}>
          <div className={styles.manifesto}>
            <p className={styles.intro}>
              Mais do que fotógrafos, somos parte do ambiente da dança. Estamos presentes nos eventos, acompanhando de perto cada movimento, cada conexão e cada momento que acontece ali.
            </p>
            
            <p>Nosso trabalho não é apenas registrar — é entender a dança.</p>

            <p>
              Trabalhamos com fotografia de eventos de dança de salão, como zouk, forró, tango, samba e outros estilos, sempre buscando capturar o timing certo, a energia do momento e a expressão real de quem está vivendo aquilo.
            </p>

            <div className={styles.teamGrid}>
              <div className={styles.memberCard}>
                <div className={styles.memberImageWrap}>
                  <Image src="/team/agnaldo.jpg" alt="Agnaldo Araujo" fill style={{ objectFit: 'cover' }} />
                </div>
                <div className={styles.memberInfo}>
                  <h3>Agnaldo Araujo</h3>
                  <p>Fundador & Fotógrafo</p>
                </div>
              </div>

              <div className={styles.memberCard}>
                <div className={styles.memberImageWrap}>
                  <Image src="/team/gih.jpg" alt="Gih Rodrigues" fill style={{ objectFit: 'cover' }} />
                </div>
                <div className={styles.memberInfo}>
                  <h3>Gih Rodrigues</h3>
                  <p>Fotógrafa</p>
                </div>
              </div>
            </div>

            <p className={styles.highlightText}>
              Por trás da 4Dance estão Agnaldo Araujo e Gih Rodrigues, fotógrafos com experiência e olhar alinhado ao universo da dança. Cada um com sua visão, mas com o mesmo objetivo: transformar momentos em imagens que realmente representem o que foi vivido.
            </p>

            <div className={styles.quoteBox}>
              <p>A gente entende que, para quem dança, aquela foto não é só uma imagem. <br/><strong>É memória, é presença, é sentimento.</strong></p>
            </div>

            <p>
              Por isso, pensamos em tudo: do posicionamento, da luz, do movimento… até o momento exato do clique.
            </p>

            <p>
              Além disso, a 4Dance também nasce com uma proposta diferente: não ser apenas um lugar onde as fotos são publicadas, mas uma plataforma onde o dançarino consegue encontrar suas imagens de forma simples, organizada e cada vez mais inteligente.
            </p>

            <div className={styles.finalCall}>
              <p>Porque no final, não se trata só de fotografia.</p>
              <h2 className={styles.finalMantra}>Se trata de registrar aquilo que só quem vive a dança entende.</h2>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
