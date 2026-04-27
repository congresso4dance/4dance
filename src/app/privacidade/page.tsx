import styles from './legal.module.css';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <Link href="/" className={styles.backLink}>
          <ArrowLeft size={18} /> Voltar
        </Link>
        <h1 className={styles.title}>Política de Privacidade</h1>
        <p className={styles.updateDate}>Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
      </header>

      <section className={styles.content}>
        <h2>1. Introdução</h2>
        <p>A 4Dance valoriza a sua privacidade. Esta política descreve como coletamos, usamos e protegemos seus dados pessoais e biométricos.</p>

        <h2>2. Dados de Reconhecimento Facial</h2>
        <p>Para facilitar a localização de suas fotos, utilizamos tecnologia de reconhecimento facial. Seus dados biométricos (embeddings) são processados de forma criptografada e não são compartilhados com terceiros para outros fins que não a identificação de suas fotos em nossa plataforma.</p>
        <p>Conforme nossa política de segurança Sovereign, os dados biométricos de usuários não convertidos são deletados periodicamente após o encerramento dos eventos.</p>

        <h2>3. Seus Direitos (LGPD)</h2>
        <p>Você tem o direito de solicitar a exclusão de seus dados a qualquer momento através do seu painel de perfil ou entrando em contato com nosso suporte.</p>
      </section>
    </main>
  );
}
