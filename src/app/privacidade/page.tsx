import styles from './legal.module.css';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <Link href="/" className={styles.backLink}>← Voltar para Home</Link>
        <h1 className={styles.title}>Política de Privacidade</h1>
        <p className={styles.text + ' ' + styles.date}>Última atualização: 21 de Abril de 2026</p>
        
        <section className={styles.sectionBlock}>
          <h2 className={styles.heading}>1. Introdução</h2>
          <p className={styles.text}>A 4Dance valoriza a sua privacidade. Esta política descreve como tratamos seus dados pessoais e as imagens capturadas em nossos eventos em conformidade com a LGPD (Lei Geral de Proteção de Dados).</p>
        </section>

        <section className={styles.sectionBlock}>
          <h2 className={styles.heading}>2. Coleta de Imagens</h2>
          <p className={styles.text}>Como uma plataforma de fotografia de dança, coletamos imagens (fotos) durante festivais e congressos. Estas imagens são processadas por nossa inteligência artificial de reconhecimento facial para facilitar que você encontre seus registros.</p>
        </section>

        <section className={styles.sectionBlock}>
          <h2 className={styles.heading}>3. Uso do Reconhecimento Facial</h2>
          <p className={styles.text}>O reconhecimento facial é utilizado exclusivamente para indexação interna e busca de fotos. Não comercializamos perfis biométricos para terceiros.</p>
        </section>

        <section className={styles.sectionBlock}>
          <h2 className={styles.heading}>4. Seus Direitos</h2>
          <p className={styles.text}>Você tem o direito de solicitar a remoção de qualquer imagem em que você apareça, bem como solicitar a exclusão de seus dados de cadastro a qualquer momento através do e-mail agnaldomoita@gmail.com.</p>
        </section>

        <section className={styles.sectionBlock}>
          <h2 className={styles.heading}>5. Segurança</h2>
          <p className={styles.text}>Utilizamos criptografia de ponta e infraestrutura da AWS/Supabase para garantir que suas memórias e dados estejam protegidos contra acessos não autorizados.</p>
        </section>
      </div>
    </main>
  );
}
