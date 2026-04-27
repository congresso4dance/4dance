"use server";

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(to: string, name: string) {
  try {
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
          
          <h2 style="font-size: 20px; font-weight: 700; color: #1a1a1a; margin-bottom: 20px;">Olá, ${name}!</h2>
          
          <p style="font-size: 16px; line-height: 1.6; color: #444;">Seja muito bem-vindo à <strong>4Dance</strong>.</p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #444;">Ficamos felizes em ter você com a gente. Seu cadastro foi realizado com sucesso e você já está a um passo de acessar tudo o que preparamos.</p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #444;">Para garantir a segurança da sua conta e liberar o acesso completo à plataforma, é necessário confirmar o seu e-mail.</p>
          
          <div style="text-align: center; margin: 35px 0;">
            <p style="font-size: 14px; color: #666; margin-bottom: 15px;">Clique no botão abaixo para confirmar:</p>
            <a href="https://4dance.com.br/login" style="background-color: #e6004c; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: background-color 0.3s;">Confirmar meu e-mail</a>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6; color: #444;">Assim que confirmar, seu acesso será liberado imediatamente.</p>
          
          <p style="font-size: 14px; line-height: 1.6; color: #888; margin-top: 30px;">Se você não reconhece este cadastro, pode ignorar esta mensagem.</p>
          
          <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 25px;">
            <p style="font-size: 16px; font-weight: 700; margin: 0;">Nos vemos dentro da 4Dance.</p>
            <p style="font-size: 15px; color: #666; margin-top: 5px;">Atenciosamente,<br><strong>Equipe 4Dance</strong></p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Resend Error:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error("Failed to send email:", err);
    return { success: false, error: err.message };
  }
}
