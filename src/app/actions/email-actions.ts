"use server";

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(to: string, name: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: '4Dance <congresso4dance@gmail.com>', 
      to: [to],
      subject: 'Bem-vindo ao 4Dance! ✨',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h1 style="color: #6d28d9;">Bem-vindo à Elite da Dança, ${name}!</h1>
          <p>Ficamos felizes em ter você conosco. Sua conta foi criada com sucesso e você já pode acessar suas memórias.</p>
          <p>Agora você pode:</p>
          <ul>
            <li>Encontrar suas fotos por reconhecimento facial</li>
            <li>Criar álbuns de favoritos</li>
            <li>Baixar suas fotos em alta resolução</li>
          </ul>
          <div style="margin-top: 30px; padding: 20px; background: #f3f4f6; border-radius: 8px;">
            <p style="margin: 0;"><strong>Dica de Mestre:</strong> Use a busca por selfie na galeria para encontrar todas as suas fotos em segundos!</p>
          </div>
          <p style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; font-size: 12px; color: #777;">
            Este é um e-mail automático da plataforma 4Dance.
          </p>
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
