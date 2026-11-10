"use server";
import { Resend } from 'resend';
import { createClient } from '@/utils/supabase/server';
import { escapeHtml } from '@/utils/escape-html';

export async function sendWelcomeEmail(to: string, name: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email || user.email.toLowerCase() !== to.trim().toLowerCase()) return { success:false, error:'Não autorizado' };
    const resend = new Resend(process.env.RESEND_API_KEY);
    const safeName = escapeHtml(name.trim().slice(0, 120));
    const { data, error } = await resend.emails.send({
      from:'4Dance <contato@4dance.com.br>', to:[user.email], subject:'Confirme seu acesso à 4Dance ✨',
      html:`<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:40px"><h1 style="color:#e6004c">4Dance</h1><h2>Bem-vindo(a), ${safeName}!</h2><p>Seu cadastro foi realizado com sucesso.</p><p>Você receberá um segundo e-mail para confirmar seu endereço.</p><p><a href="https://4dance.com.br/eventos">Ver eventos</a></p></div>`,
    });
    return error ? { success:false, error:error.message } : { success:true, data };
  } catch (error) { return { success:false, error:error instanceof Error ? error.message : 'Erro ao enviar e-mail' }; }
}
