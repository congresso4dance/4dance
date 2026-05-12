import styles from './legal.module.css';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Política de Privacidade | 4Dance',
};

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
        <h2>1. Quem somos</h2>
        <p>A <strong>4Dance</strong> é uma plataforma brasileira de fotografia especializada em eventos de dança de salão. Somos responsáveis pelo tratamento dos seus dados pessoais conforme descrito nesta política.</p>
        <p>Contato do Encarregado de Dados (DPO): <a href="mailto:agnaldomoita@gmail.com">agnaldomoita@gmail.com</a></p>

        <h2>2. Quais dados coletamos</h2>

        <h3>2.1 Dados de cadastro</h3>
        <ul>
          <li>Nome completo</li>
          <li>Endereço de e-mail</li>
          <li>Número de telefone / WhatsApp (quando fornecido)</li>
        </ul>

        <h3>2.2 Dados biométricos (reconhecimento facial)</h3>
        <p>Para localizar automaticamente suas fotos nos eventos, utilizamos tecnologia de reconhecimento facial. Coletamos <strong>embeddings faciais</strong> — representações matemáticas do seu rosto, não imagens diretamente. Esses dados são:</p>
        <ul>
          <li>Processados e armazenados de forma criptografada</li>
          <li>Utilizados exclusivamente para identificar suas fotos na plataforma</li>
          <li>Nunca compartilhados com terceiros para outros fins</li>
          <li>Deletados periodicamente após o encerramento dos eventos para usuários não convertidos</li>
        </ul>

        <h3>2.3 Dados de pagamento</h3>
        <p>Pagamentos são processados pela Stripe. A 4Dance não armazena dados de cartão de crédito. Apenas registramos o ID da transação e o status do pedido.</p>

        <h3>2.4 Dados de uso e navegação</h3>
        <ul>
          <li>Endereço IP</li>
          <li>Páginas visitadas e tempo de permanência</li>
          <li>Tipo de dispositivo e navegador</li>
          <li>Eventos pesquisados na plataforma</li>
        </ul>

        <h3>2.5 Dados de leads / newsletter</h3>
        <p>Quando você se inscreve na newsletter ou demonstra interesse em eventos, coletamos nome e e-mail para comunicações sobre novas fotos e eventos.</p>

        <h2>3. Por que coletamos (base legal — LGPD)</h2>
        <ul>
          <li><strong>Execução de contrato</strong> — para entregar fotos compradas e gerenciar sua conta</li>
          <li><strong>Consentimento</strong> — para reconhecimento facial, newsletter e comunicações de marketing</li>
          <li><strong>Legítimo interesse</strong> — para segurança da plataforma, prevenção a fraudes e analytics</li>
          <li><strong>Cumprimento de obrigação legal</strong> — quando exigido por lei (ex.: registros fiscais)</li>
        </ul>

        <h2>4. Com quem compartilhamos seus dados</h2>
        <ul>
          <li><strong>Supabase</strong> — banco de dados e armazenamento de arquivos (servidores na AWS us-east-1)</li>
          <li><strong>Stripe</strong> — processamento de pagamentos</li>
          <li><strong>Google Analytics</strong> — análise de tráfego (somente após consentimento, dados anonimizados)</li>
          <li><strong>Resend</strong> — envio de e-mails transacionais</li>
          <li><strong>Fotógrafos parceiros</strong> — apenas dados mínimos necessários para entrega das fotos</li>
        </ul>
        <p>Não vendemos nem alugamos seus dados pessoais a terceiros.</p>

        <h2>5. Cookies e tecnologias de rastreamento</h2>
        <p>Utilizamos cookies para autenticação, preferências e analytics. Consulte nossa <Link href="/cookies">Política de Cookies</Link> para detalhes completos. Você pode gerenciar suas preferências a qualquer momento pelo banner de cookies.</p>

        <h2>6. Inteligência Artificial</h2>
        <p>Nossa plataforma utiliza IA para reconhecimento facial e indexação de fotos. O processamento de IA pode envolver:</p>
        <ul>
          <li>Detecção de rostos em imagens de eventos</li>
          <li>Geração de embeddings para busca personalizada</li>
          <li>Análise de qualidade de imagem</li>
        </ul>
        <p>As decisões automatizadas baseadas em IA estão sujeitas à revisão humana. Você pode solicitar intervenção humana em qualquer processo automatizado.</p>

        <h2>7. Por quanto tempo guardamos seus dados</h2>
        <ul>
          <li><strong>Conta de usuário</strong> — enquanto a conta estiver ativa, ou até solicitação de exclusão</li>
          <li><strong>Embeddings faciais</strong> — excluídos após o evento (usuários não cadastrados) ou com a conta</li>
          <li><strong>Pedidos e pagamentos</strong> — 5 anos conforme legislação fiscal brasileira</li>
          <li><strong>Logs de acesso</strong> — 6 meses conforme Marco Civil da Internet</li>
          <li><strong>Newsletter</strong> — até cancelamento da inscrição</li>
        </ul>

        <h2>8. Seus direitos (LGPD — Art. 18)</h2>
        <p>Você tem direito a:</p>
        <ul>
          <li><strong>Acesso</strong> — saber quais dados temos sobre você</li>
          <li><strong>Correção</strong> — corrigir dados incompletos ou desatualizados</li>
          <li><strong>Exclusão</strong> — solicitar a exclusão de dados tratados com base no consentimento</li>
          <li><strong>Portabilidade</strong> — receber seus dados em formato estruturado</li>
          <li><strong>Oposição</strong> — se opor a tratamentos com base em legítimo interesse</li>
          <li><strong>Revogação do consentimento</strong> — a qualquer momento, sem prejuízo do que já foi tratado</li>
          <li><strong>Informação</strong> — sobre com quem compartilhamos seus dados</li>
        </ul>
        <p>Para exercer seus direitos, acesse nossa <Link href="/lgpd">Central LGPD</Link> ou entre em contato pelo e-mail <a href="mailto:agnaldomoita@gmail.com">agnaldomoita@gmail.com</a>.</p>

        <h2>9. Segurança</h2>
        <p>Adotamos medidas técnicas e organizacionais para proteger seus dados, incluindo:</p>
        <ul>
          <li>Comunicação via HTTPS/TLS</li>
          <li>Senhas armazenadas com hash criptográfico</li>
          <li>Dados biométricos criptografados em repouso</li>
          <li>Controle de acesso baseado em funções (RBAC)</li>
          <li>Backups automáticos</li>
          <li>Monitoramento de acessos administrativos</li>
        </ul>

        <h2>10. Transferência internacional</h2>
        <p>Alguns de nossos prestadores de serviço (Supabase/AWS, Stripe, Google) processam dados fora do Brasil. Essas transferências são realizadas com base em cláusulas contratuais padrão e garantias equivalentes às exigidas pela LGPD.</p>

        <h2>11. Alterações nesta política</h2>
        <p>Podemos atualizar esta política periodicamente. Mudanças significativas serão comunicadas por e-mail ou aviso na plataforma. O uso continuado após a notificação implica aceitação das mudanças.</p>

        <h2>12. Contato e DPO</h2>
        <p>Para dúvidas, solicitações ou reclamações relacionadas à privacidade:</p>
        <ul>
          <li>E-mail: <a href="mailto:agnaldomoita@gmail.com">agnaldomoita@gmail.com</a></li>
          <li>Central LGPD: <Link href="/lgpd">4dance.com.br/lgpd</Link></li>
          <li>ANPD (Autoridade Nacional de Proteção de Dados): <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer">www.gov.br/anpd</a></li>
        </ul>
      </section>
    </main>
  );
}
