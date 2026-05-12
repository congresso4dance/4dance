import { Resend } from "resend";
import { NextResponse } from "next/server";
import { AuthEmail } from "@/emails/AuthEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  // 🛡️ Segurança: Verificar se a requisição é interna ou autorizada
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  const isInternal = origin?.includes(host || "") || !origin;

  if (!isInternal) {
    return NextResponse.json({ error: "Acesso não autorizado" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { email, type, magicLink, username } = body;

    if (!email) {
      return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 });
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
