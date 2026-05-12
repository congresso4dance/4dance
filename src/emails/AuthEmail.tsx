import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";
import * as React from "react";

interface AuthEmailProps {
  magicLink?: string;
  type?: "magic_link" | "welcome" | "reset_password";
  username?: string;
}

export const AuthEmail = ({
  magicLink = "https://4dance.com.br/auth/callback",
  type = "magic_link",
  username = "Dançarino(a)",
}: AuthEmailProps) => {
  const previewText = 
    type === "magic_link" ? "Seu link de acesso seguro à 4Dance" :
    type === "reset_password" ? "Redefinição de senha da sua conta 4Dance" :
    "Bem-vindo(a) à 4Dance!";

  const getTitle = () => {
    switch (type) {
      case "magic_link": return "Acesse sua conta";
      case "welcome": return "Bem-vindo(a) à 4Dance";
      case "reset_password": return "Redefinir senha";
    }
  };

  const getBodyText = () => {
    switch (type) {
      case "magic_link": return "Clique no botão abaixo para fazer login seguro na sua conta. O link expira em 24 horas e só pode ser usado uma vez.";
      case "welcome": return "Estamos muito felizes em ter você na 4Dance. Comece a explorar e gerenciar suas competições e eventos agora mesmo.";
      case "reset_password": return "Recebemos um pedido para redefinir sua senha. Se foi você, clique no botão abaixo para criar uma nova senha.";
    }
  };

  const getButtonText = () => {
    switch (type) {
      case "magic_link": return "Entrar na 4Dance";
      case "welcome": return "Acessar Plataforma";
      case "reset_password": return "Redefinir Minha Senha";
    }
  };

  return (
    <Html>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                brand: "#E11D48", // Rose-600 premium brand color
                dark: "#1A1A1A",
              },
            },
          },
        }}
      >
        <Head />
        <Preview>{previewText}</Preview>
        <Body className="bg-zinc-50 font-sans my-auto mx-auto pt-8 px-4">
          <Container className="bg-white border border-zinc-200 rounded-2xl my-[40px] mx-auto p-[40px] max-w-[500px] shadow-sm">
            <Section className="text-center mt-[10px] mb-[20px]">
              <Heading className="text-brand text-3xl font-bold tracking-tight mb-0">
                4Dance
              </Heading>
            </Section>

            <Heading className="text-dark text-[24px] font-semibold text-center mt-[20px] mx-0 mb-[16px]">
              {getTitle()}
            </Heading>

            <Text className="text-zinc-600 text-[16px] leading-[26px] mb-8">
              Olá, {username},
            </Text>

            <Text className="text-zinc-600 text-[16px] leading-[26px]">
              {getBodyText()}
            </Text>

            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-brand rounded-xl text-white text-[16px] font-semibold no-underline text-center px-8 py-4 w-full"
                href={magicLink}
              >
                {getButtonText()}
              </Button>
            </Section>

            {type !== "welcome" && (
              <>
                <Text className="text-zinc-500 text-[14px] leading-[24px]">
                  Ou copie e cole este link no seu navegador:
                </Text>
                <Link
                  href={magicLink}
                  className="text-brand text-[14px] break-all underline"
                >
                  {magicLink}
                </Link>
              </>
            )}

            <Hr className="border border-solid border-zinc-200 my-[32px] mx-0 w-full" />

            <Text className="text-zinc-400 text-[12px] leading-[20px] text-center">
              © {new Date().getFullYear()} 4Dance. Todos os direitos reservados.
              <br />
              Se você não solicitou este e-mail, pode ignorá-lo com segurança.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default AuthEmail;
