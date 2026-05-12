import styles from './legal.module.css';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Política de Cookies | 4Dance',
};

export default function CookiesPolicy() {
  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <Link href="/" className={styles.backLink}>
          <ArrowLeft size={18} /> Voltar
        </Link>
        <h1 className={styles.title}>Política de Cookies</h1>
        <p className={styles.updateDate}>Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
      </header>

      <section className={styles.content}>
        <h2>1. O que são cookies?</h2>
        <p>Cookies são pequenos arquivos de texto armazenados no seu dispositivo quando você visita um site. Eles permitem que o site lembre suas preferências e melhore sua experiência de navegação.</p>

        <h2>2. Quais cookies usamos?</h2>

        <h3>2.1 Cookies essenciais</h3>
        <p>Necessários para o funcionamento da plataforma. Sem eles, serviços como autenticação e carrinho de compras não funcionam. Esses cookies não requerem consentimento.</p>
        <ul>
          <li><strong>sb-*</strong> — Sessão de autenticação Supabase</li>
          <li><strong>cookie_consent</strong> — Armazena sua preferência de consentimento</li>
        </ul>

        <h3>2.2 Cookies de desempenho e analytics</h3>
        <p>Usados para entender como os visitantes interagem com o site. Coletamos dados de forma anônima e agregada.</p>
        <ul>
          <li><strong>_ga, _gid, _gat</strong> — Google Analytics. Rastreiam páginas visitadas, tempo de sessão e origem do tráfego.</li>
        </ul>

        <h3>2.3 Cookies de funcionalidade</h3>
        <p>Permitem que o site lembre escolhas que você fez (como idioma ou preferências de exibição) para oferecer uma experiência personalizada.</p>

        <h2>3. Cookies de terceiros</h2>
        <p>Utilizamos serviços de terceiros que podem definir seus próprios cookies:</p>
        <ul>
          <li><strong>Google Analytics</strong> — Análise de tráfego e comportamento</li>
          <li><strong>Stripe</strong> — Processamento seguro de pagamentos</li>
        </ul>
        <p>Esses terceiros possuem suas próprias políticas de privacidade, que recomendamos que você consulte.</p>

        <h2>4. Como gerenciar cookies</h2>
        <p>Você pode controlar e/ou excluir cookies como desejar. Para isso:</p>
        <ul>
          <li>Use o banner de cookies exibido na sua primeira visita para aceitar ou recusar cookies não essenciais</li>
          <li>Configure seu navegador para bloquear ou alertar sobre cookies</li>
          <li>Exclua cookies já armazenados nas configurações do seu navegador</li>
        </ul>
        <p>Atenção: bloquear todos os cookies pode afetar funcionalidades da plataforma, como login e compras.</p>

        <h2>5. Consentimento</h2>
        <p>Ao clicar em "Aceitar" no banner de cookies, você consente com o uso de cookies não essenciais conforme descrito nesta política. Você pode revogar esse consentimento a qualquer momento limpando os cookies do seu navegador ou entrando em contato conosco.</p>

        <h2>6. Contato</h2>
        <p>Dúvidas sobre nossa política de cookies? Entre em contato: <a href="mailto:agnaldomoita@gmail.com">agnaldomoita@gmail.com</a></p>
        <p>Para solicitações relacionadas à LGPD, acesse nossa <Link href="/lgpd">Central LGPD</Link>.</p>
      </section>
    </main>
  );
}
