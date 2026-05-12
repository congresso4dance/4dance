import styles from './legal.module.css';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Termos de Uso | 4Dance',
};

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
        <h2>1. Aceitação dos Termos</h2>
        <p>Ao acessar ou usar a plataforma <strong>4Dance</strong>, você concorda com estes Termos de Uso. Se não concordar com qualquer parte, não utilize o serviço.</p>

        <h2>2. Sobre a plataforma</h2>
        <p>A 4Dance é uma plataforma brasileira de fotografia especializada em eventos de dança de salão. Oferecemos:</p>
        <ul>
          <li>Galeria e venda de fotos de eventos de dança</li>
          <li>Busca por reconhecimento facial</li>
          <li>Portal para fotógrafos parceiros</li>
          <li>Portal para produtores de eventos</li>
        </ul>

        <h2>3. Elegibilidade e cadastro</h2>
        <p>Para utilizar a plataforma você deve:</p>
        <ul>
          <li>Ter no mínimo <strong>13 anos</strong> de idade. Menores de 18 anos precisam de consentimento dos responsáveis</li>
          <li>Fornecer informações verdadeiras no cadastro</li>
          <li>Manter a segurança da sua conta e senha</li>
          <li>Ser responsável por toda atividade realizada com sua conta</li>
        </ul>
        <p>Contas com informações falsas podem ser suspensas sem aviso prévio.</p>

        <h2>4. Uso permitido</h2>
        <p>Você pode usar a 4Dance para:</p>
        <ul>
          <li>Encontrar e adquirir fotos de eventos em que participou</li>
          <li>Baixar fotos adquiridas para uso pessoal</li>
          <li>Compartilhar suas fotos nas redes sociais com crédito ao fotógrafo</li>
        </ul>

        <h2>5. Uso proibido</h2>
        <p>É expressamente proibido:</p>
        <ul>
          <li>Usar a plataforma para fins comerciais sem autorização prévia</li>
          <li>Redistribuir, revender ou licenciar fotos adquiridas</li>
          <li>Tentar acessar contas ou áreas restritas de terceiros</li>
          <li>Fazer engenharia reversa, scraping ou uso automatizado sem permissão</li>
          <li>Fazer upload de conteúdo que viole direitos autorais de terceiros</li>
          <li>Criar perfis falsos ou se passar por outra pessoa</li>
          <li>Usar a plataforma para spam, fraudes ou golpes</li>
          <li>Publicar conteúdo de ódio, discriminatório ou que incite violência</li>
          <li>Publicar conteúdo sexual explícito não solicitado</li>
          <li>Praticar assédio ou perseguição a outros usuários</li>
        </ul>

        <h2>6. Propriedade intelectual</h2>
        <p>Todas as fotos disponíveis na plataforma são de propriedade intelectual dos respectivos fotógrafos. A compra de uma foto concede ao usuário uma <strong>licença de uso pessoal, não exclusiva e intransferível</strong>, que permite:</p>
        <ul>
          <li>Impressão para uso pessoal</li>
          <li>Compartilhamento em redes sociais pessoais com crédito ao fotógrafo</li>
          <li>Uso como recordação pessoal</li>
        </ul>
        <p>É vedada qualquer comercialização, licenciamento ou uso para fins lucrativos das fotos adquiridas sem autorização expressa do fotógrafo.</p>
        <p>O logotipo, marca, nome "4Dance" e todo o conteúdo editorial da plataforma são propriedade exclusiva da 4Dance.</p>

        <h2>7. Fotógrafos parceiros</h2>
        <p>Fotógrafos que utilizam o portal da 4Dance concordam que:</p>
        <ul>
          <li>São titulares dos direitos autorais das fotos que fazem upload</li>
          <li>Concedem à 4Dance licença para exibir e comercializar as fotos na plataforma</li>
          <li>São responsáveis por obter consentimento dos fotografados quando necessário</li>
          <li>A comissão da plataforma é descontada automaticamente via Stripe Connect</li>
        </ul>

        <h2>8. Reembolsos e política de devolução</h2>
        <p>Devido à natureza digital dos produtos, reembolsos são processados apenas nos seguintes casos:</p>
        <ul>
          <li>Erro técnico comprovado que impossibilitou o acesso às fotos</li>
          <li>Cobrança duplicada</li>
          <li>Foto entregue diferente da visualizada no checkout</li>
        </ul>
        <p>Solicitações de reembolso devem ser feitas em até <strong>7 dias corridos</strong> após a compra, conforme o Código de Defesa do Consumidor (CDC). Entre em contato pelo e-mail <a href="mailto:agnaldomoita@gmail.com">agnaldomoita@gmail.com</a>.</p>

        <h2>9. Moderação e suspensão de conta</h2>
        <p>A 4Dance reserva-se o direito de, a qualquer momento e sem aviso prévio:</p>
        <ul>
          <li>Remover conteúdo que viole estes termos</li>
          <li>Suspender temporariamente contas infratoras</li>
          <li>Banir permanentemente usuários que violem repetidamente as regras</li>
          <li>Reportar atividades ilegais às autoridades competentes</li>
        </ul>

        <h2>10. Inteligência Artificial</h2>
        <p>A plataforma utiliza recursos de Inteligência Artificial para:</p>
        <ul>
          <li>Identificação de rostos para facilitar a busca de fotos</li>
          <li>Indexação automática de imagens</li>
        </ul>
        <p>A IA pode cometer erros. A 4Dance não garante 100% de precisão no reconhecimento facial. Os resultados devem ser verificados pelo usuário. Você pode optar por não usar o reconhecimento facial e buscar suas fotos manualmente.</p>

        <h2>11. Limitação de responsabilidade</h2>
        <p>A 4Dance não se responsabiliza por:</p>
        <ul>
          <li>Interrupções temporárias do serviço</li>
          <li>Perda de dados por eventos fora de nosso controle</li>
          <li>Conteúdo publicado por fotógrafos parceiros</li>
          <li>Danos indiretos decorrentes do uso da plataforma</li>
        </ul>

        <h2>12. Marco Civil da Internet</h2>
        <p>A 4Dance cumpre a Lei nº 12.965/2014 (Marco Civil da Internet). Mantemos logs de acesso pelo período mínimo exigido por lei (6 meses) e podemos fornecê-los mediante ordem judicial.</p>
        <p>Conteúdo infringente pode ser denunciado pelo e-mail <a href="mailto:agnaldomoita@gmail.com">agnaldomoita@gmail.com</a>. Agiremos em conformidade com a lei após análise.</p>

        <h2>13. Lei aplicável e foro</h2>
        <p>Estes termos são regidos pelas leis da República Federativa do Brasil. Para dirimir quaisquer controvérsias, fica eleito o foro da comarca de Brasília/DF, com renúncia a qualquer outro, por mais privilegiado que seja.</p>

        <h2>14. Alterações nos termos</h2>
        <p>Podemos atualizar estes termos a qualquer momento. Notificaremos mudanças significativas por e-mail ou aviso na plataforma. O uso continuado após a notificação implica aceitação das mudanças.</p>

        <h2>15. Contato</h2>
        <p>Dúvidas sobre estes termos: <a href="mailto:agnaldomoita@gmail.com">agnaldomoita@gmail.com</a></p>
        <p>Para solicitações de dados pessoais: <Link href="/lgpd">Central LGPD</Link></p>
      </section>
    </main>
  );
}
