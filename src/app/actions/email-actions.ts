"use server";

import { Resend } from 'resend';

let resendInstance: Resend | null = null;

function getResend() {
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Erro desconhecido ao enviar e-mail";
}

export async function sendWelcomeEmail(to: string, name: string) {
  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: '4Dance <contato@4dance.com.br>', 
      to: [to],
      subject: 'Confirme seu acesso à 4Dance ✨',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; color: #1a1a1a; background-color: #ffffff; border: 1px solid #eaeaea; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #e6004c; font-size: 28px; font-weight: 800; margin: 0;">4Dance</h1>
            <p style="color: #666; font-size: 14px; margin-top: 5px;">Memórias em Movimento</p>
          </div>

          <h2 style="font-size: 20px; font-weight: 700; color: #1a1a1a; margin-bottom: 20px;">Bem-vindo(a), ${name}! 🎉</h2>

          <p style="font-size: 16px; line-height: 1.6; color: #444;">Seu cadastro na <strong>4Dance</strong> foi realizado com sucesso!</p>

          <p style="font-size: 16px; line-height: 1.6; color: #444;">Você receberá em breve um segundo e-mail para confirmar seu endereço. Depois de confirmar, seu acesso estará liberado.</p>

          <div style="background: #fff8f0; border-left: 4px solid #e6004c; padding: 16px 20px; border-radius: 6px; margin: 24px 0;">
            <p style="margin: 0; font-size: 14px; color: #666;">📬 <strong>Verifique também sua caixa de spam</strong> caso não encontre o e-mail de confirmação na caixa de entrada.</p>
          </div>

          <p style="font-size: 16px; line-height: 1.6; color: #444;">Na 4Dance você encontra suas fotos em eventos de dança usando <strong>reconhecimento facial por IA</strong> — é só enviar uma selfie!</p>

          <div style="text-align: center; margin: 35px 0;">
            <a href="https://4dance.com.br/eventos" style="background-color: #e6004c; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block;">Ver Eventos</a>
          </div>

          <p style="font-size: 14px; line-height: 1.6; color: #888; margin-top: 30px;">Se você não criou esta conta, pode ignorar este e-mail.</p>

          <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 25px;">
            <p style="font-size: 16px; font-weight: 700; margin: 0;">Nos vemos na pista! 💃🕺</p>
            <p style="font-size: 15px; color: #666; margin-top: 5px;">Equipe 4Dance</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Resend Error:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err: unknown) {
    console.error("Failed to send email:", err);
    return { success: false, error: getErrorMessage(err) };
  }
}
