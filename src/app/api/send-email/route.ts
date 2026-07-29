import { Resend } from "resend";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { AuthEmail } from "@/emails/AuthEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

// Só esses tipos de e-mail são suportados — evita usar essa rota como um
// mailer genérico para qualquer assunto.
const ALLOWED_TYPES = new Set(["welcome", "magic_link", "reset_password"]);

// Janela de tempo em que a conta precisa ter sido criada pra aceitar o envio
// do e-mail de boas-vindas. Essa rota existe só pra mandar o e-mail logo
// após o cadastro — não é (e não deveria virar) um mailer de uso geral.
const SIGNUP_EMAIL_WINDOW_MS = 15 * 60 * 1000;

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, email, type, magicLink, username } = body;

    if (!email || !userId) {
      return NextResponse.json({ error: "userId e email são obrigatórios" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(type)) {
      return NextResponse.json({ error: "Tipo de e-mail inválido" }, { status: 400 });
    }

    // 🛡️ Segurança: em vez de confiar em headers (spoofáveis) ou aceitar
    // qualquer endereço vindo do corpo da requisição, validamos no servidor
    // (via Admin API do Supabase, chave de service role) que o userId
    // informado corresponde de fato a uma conta real, recém-criada, e que o
    // e-mail bate com o cadastrado — assim ninguém consegue usar essa rota
    // pra mandar e-mail em nome do 4Dance pra um endereço arbitrário.
    const supabaseAdmin = getSupabaseAdmin();
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (userError || !userData?.user) {
      return NextResponse.json({ error: "Conta não encontrada" }, { status: 403 });
    }

    if (userData.user.email?.toLowerCase() !== String(email).toLowerCase()) {
      return NextResponse.json({ error: "E-mail não corresponde à conta" }, { status: 403 });
    }

    const createdAt = userData.user.created_at ? new Date(userData.user.created_at).getTime() : 0;
    if (!createdAt || Date.now() - createdAt > SIGNUP_EMAIL_WINDOW_MS) {
      return NextResponse.json({ error: "Fora da janela de envio permitida" }, { status: 403 });
    }

    const { data, error } = await resend.emails.send({
      from: "4Dance <contato@4dance.com.br>",
      to: [email],
      subject: type === "welcome" ? "Bem-vindo(a) à 4Dance" : "Seu link de acesso - 4Dance",
      react: AuthEmail({ magicLink, type, username }) as React.ReactElement,
    });

    if (error) {
      console.error("Erro ao enviar email:", error);
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Erro inesperado ao enviar email:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
