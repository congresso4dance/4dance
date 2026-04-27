import styles from './legal.module.css';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <Link href="/" className={styles.backLink}>
          <ArrowLeft size={18} /> Voltar
        </Link>
        <h1 className={styles.title}>Termos de Uso</h1>
        <p className={styles.updateDate}>Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
      </header>

      <section className={styles.content}>
        <h2>1. Uso da Plataforma</h2>
        <p>Ao utilizar a 4Dance, você concorda em cumprir nossos termos. A plataforma destina-se à venda e entrega de fotos de eventos de dança.</p>

        <h2>2. Propriedade Intelectual</h2>
        <p>Todas as fotos disponibilizadas na plataforma são de propriedade intelectual dos respectivos fotógrafos. A compra de uma foto concede a você uma licença de uso pessoal, sendo vedada a comercialização ou uso para fins lucrativos sem autorização prévia.</p>

        <h2>3. Reembolsos</h2>
        <p>Devido à natureza digital do produto, reembolsos são processados apenas em casos de erro técnico comprovado ou duplicidade de pagamento.</p>
      </section>
    </main>
  );
}
