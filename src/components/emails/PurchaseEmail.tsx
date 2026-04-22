import { Html, Body, Head, Heading, Container, Preview, Section, Text, Button, Img, Hr } from '@react-email/components';
import * as React from 'react';

interface PurchaseEmailProps {
  customerName: string;
  orderId: string;
  amount: number;
}

export default function PurchaseEmail({ customerName = 'Bailarino(a)', orderId, amount }: PurchaseEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Suas fotos da 4Dance estão liberadas em HD! ✨</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img src="https://oaqpzzolrftvtdchrmro.supabase.co/storage/v1/object/public/4dance/Logo%20l%204dance_BRANCA.png" width="120" style={logo} alt="4Dance" />
          
          <Heading style={h1}>Pagamento Aprovado! 📸</Heading>
          
          <Text style={text}>
            Olá, <strong>{customerName}</strong>!
          </Text>
          
          <Text style={text}>
            Recebemos o seu pagamento de R$ {amount.toFixed(2).replace('.', ',')} referente ao pedido <strong>#{orderId?.slice(0, 8).toUpperCase()}</strong>.
            Suas fotos oficiais em Alta Resolução (sem marca d'água) já estão disponíveis para download imediato.
          </Text>

          <Section style={btnContainer}>
            <Button style={button} href={`https://4dance.com.br/minhas-compras`}>
              Acessar Minhas Fotos
            </Button>
          </Section>

          <Text style={text}>
            Para garantir que as fotos tenham a melhor qualidade, recomendamos baixá-las utilizando uma rede Wi-Fi estável.
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            Se precisar de ajuda, basta responder a este e-mail.
            <br />
            Com carinho, Equipe 4Dance.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#000000',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#111111',
  margin: '0 auto',
  padding: '40px 20px',
  borderRadius: '12px',
  border: '1px solid #333',
  maxWidth: '600px',
};

const logo = {
  margin: '0 auto',
  marginBottom: '20px',
};

const h1 = {
  color: '#e11d48', // accent red
  fontSize: '24px',
  fontWeight: '800',
  textAlign: 'center' as const,
  margin: '30px 0',
  letterSpacing: '-0.5px'
};

const text = {
  color: '#e5e5e5',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
  marginBottom: '20px',
};

const btnContainer = {
  textAlign: 'center' as const,
  marginTop: '40px',
  marginBottom: '40px',
};

const button = {
  backgroundColor: '#e11d48',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 28px',
  border: '1px solid #fb7185',
  boxShadow: '0 4px 15px rgba(225, 29, 72, 0.4)',
};

const hr = {
  borderColor: '#333',
  margin: '40px 0',
};

const footer = {
  color: '#888888',
  fontSize: '14px',
  lineHeight: '22px',
  textAlign: 'center' as const,
};
