'use server'

import { Resend } from 'resend'

export type LgpdRequest = {
  name: string
  email: string
  type: string
  description: string
}

export async function submitLgpdRequest(data: LgpdRequest): Promise<{ success: boolean; error?: string }> {
  const resend = new Resend(process.env.RESEND_API_KEY)

  const typeLabels: Record<string, string> = {
    access: 'Acesso aos dados',
    correction: 'Correção de dados',
    deletion: 'Exclusão de dados',
    portability: 'Portabilidade de dados',
    opposition: 'Oposição ao tratamento',
    revocation: 'Revogação de consentimento',
    other: 'Outra solicitação',
  }

  try {
    await resend.emails.send({
      from: 'LGPD 4Dance <noreply@4dance.com.br>',
      to: 'agnaldomoita@gmail.com',
      subject: `[LGPD] ${typeLabels[data.type] ?? data.type} — ${data.name}`,
      html: `
        <h2>Solicitação LGPD recebida</h2>
        <p><strong>Nome:</strong> ${data.name}</p>
        <p><strong>E-mail:</strong> ${data.email}</p>
        <p><strong>Tipo:</strong> ${typeLabels[data.type] ?? data.type}</p>
        <p><strong>Descrição:</strong></p>
        <p>${data.description.replace(/\n/g, '<br>')}</p>
        <hr>
        <p style="color:#888;font-size:12px">Responda em até 15 dias úteis conforme Art. 18 da LGPD.</p>
      `,
    })
    return { success: true }
  } catch (err) {
    console.error('LGPD email error:', err)
    return { success: false, error: 'Erro ao enviar solicitação. Tente novamente.' }
  }
}
