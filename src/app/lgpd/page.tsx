import styles from './legal.module.css';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import LgpdForm from './LgpdForm';

export const metadata = {
  title: 'Central LGPD | 4Dance',
};

export default function LgpdPage() {
  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <Link href="/" className={styles.backLink}>
          <ArrowLeft size={18} /> Voltar
        </Link>
        <h1 className={styles.title}>Central LGPD</h1>
        <p className={styles.subtitle}>
          Exercite seus direitos sobre seus dados pessoais conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
        </p>
      </header>

      <section className={styles.content}>
        <h2>Seus direitos</h2>
        <p>Conforme o Art. 18 da LGPD, você tem direito a:</p>
        <ul>
          <li><strong>Acesso</strong> — saber quais dados pessoais temos sobre você</li>
          <li><strong>Correção</strong> — corrigir dados incompletos, inexatos ou desatualizados</li>
          <li><strong>Exclusão</strong> — solicitar a eliminação de dados tratados com base no seu consentimento</li>
          <li><strong>Portabilidade</strong> — receber seus dados em formato estruturado e interoperável</li>
          <li><strong>Oposição</strong> — se opor a tratamentos realizados com base em legítimo interesse</li>
          <li><strong>Revogação do consentimento</strong> — retirar o consentimento a qualquer momento</li>
          <li><strong>Informação</strong> — saber com quais entidades compartilhamos seus dados</li>
        </ul>

        <h2>Prazos</h2>
        <p>Responderemos sua solicitação em até <strong>15 dias úteis</strong>, conforme previsto na LGPD. Em casos de alta complexidade, poderemos prorrogar esse prazo, notificando você.</p>

        <h2>Formulário de solicitação</h2>
        <p>Preencha o formulário abaixo para registrar sua solicitação. Enviaremos a confirmação e a resposta para o e-mail informado.</p>

        <LgpdForm />

        <h2>Outras formas de contato</h2>
        <ul>
          <li>E-mail: <a href="mailto:agnaldomoita@gmail.com">agnaldomoita@gmail.com</a></li>
          <li>WhatsApp: <a href="https://wa.me/5561993574377" target="_blank" rel="noopener noreferrer">+55 61 99357-4377</a></li>
        </ul>

        <h2>Insatisfeito com nossa resposta?</h2>
        <p>Você pode contatar a Autoridade Nacional de Proteção de Dados (ANPD):</p>
        <ul>
          <li><a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer">www.gov.br/anpd</a></li>
        </ul>

        <p style={{ marginTop: '2.5rem' }}>
          Consulte também nossa <Link href="/privacidade">Política de Privacidade</Link> e nossa <Link href="/cookies">Política de Cookies</Link>.
        </p>
      </section>
    </main>
  );
}
