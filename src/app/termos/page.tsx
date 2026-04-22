import styles from '../privacidade/legal.module.css';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <Link href="/" className={styles.backLink}>← Voltar para Home</Link>
        <h1 className={styles.title}>Termos de Uso</h1>
        <p className={styles.text + ' ' + styles.date}>Última atualização: 21 de Abril de 2026</p>
        
        <section className={styles.sectionBlock}>
          <h2 className={styles.heading}>1. Objeto</h2>
          <p className={styles.text}>A 4Dance é uma plataforma de visualização e aquisição de fotografias profissionais de eventos de dança. Os presentes termos regem o acesso e uso do site.</p>
        </section>

        <section className={styles.sectionBlock}>
          <h2 className={styles.heading}>2. Direitos de Imagem e Autorais</h2>
          <p className={styles.text}>Todas as fotografias exibidas são de propriedade intelectual da 4Dance e seus fotógrafos associados. A compra de uma foto concede ao usuário uma licença de uso pessoal e não comercial (ex: redes sociais pessoais), mantendo os direitos autorais com o criador.</p>
        </section>

        <section className={styles.sectionBlock}>
          <h2 className={styles.heading}>3. Uso do Portal</h2>
          <p className={styles.text}>O usuário se compromete a não utilizar bots, scrapers ou qualquer ferramenta automatizada para extrair imagens sem a marca d’água ou sem a devida autorização legal.</p>
        </section>

        <section className={styles.sectionBlock}>
          <h2 className={styles.heading}>4. Aquisição de Álbuns e Pagamentos</h2>
          <p className={styles.text}>O acesso a álbuns digitais e download de fotos está sujeito ao pagamento da taxa correspondente via PIX ou Cartão de Crédito. Utilizamos o **Stripe** como processador de pagamentos seguro, não armazenando seus dados de cartão em nossos servidores.</p>
        </section>

        <section className={styles.sectionBlock}>
          <h2 className={styles.heading}>5. Política de Reembolso</h2>
          <p className={styles.text}>Por se tratar de um produto digital de entrega instantânea e consumo imediato (download), o direito de arrependimento de 7 dias não se aplica após a realização do download da fotografia. Caso haja algum erro técnico no arquivo, faremos a substituição sem custo adicional.</p>
        </section>

        <section className={styles.sectionBlock}>
          <h2 className={styles.heading}>6. Limitação de Responsabilidade</h2>
          <p className={styles.text}>A 4Dance não se responsabiliza por eventuais interrupções temporárias do serviço ou compartilhamento indevido de links de álbuns por parte dos usuários.</p>
        </section>
      </div>
    </main>
  );
}
