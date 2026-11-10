'use server'
import { Resend } from 'resend'
import { z } from 'zod'
import { escapeHtml } from '@/utils/escape-html'

export type LgpdRequest = { name: string; email: string; type: string; description: string }
const schema = z.object({ name: z.string().trim().min(2).max(120), email: z.string().trim().email().max(254), type: z.enum(['access','correction','deletion','portability','opposition','revocation','other']), description: z.string().trim().min(10).max(5000) })
const labels: Record<z.infer<typeof schema>['type'], string> = { access:'Acesso aos dados', correction:'Correção de dados', deletion:'Exclusão de dados', portability:'Portabilidade de dados', opposition:'Oposição ao tratamento', revocation:'Revogação de consentimento', other:'Outra solicitação' }

export async function submitLgpdRequest(input: LgpdRequest): Promise<{ success: boolean; error?: string }> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { success:false, error:'Revise os dados informados.' }
  const data = parsed.data
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from:'LGPD 4Dance <noreply@4dance.com.br>', to:'agnaldomoita@gmail.com',
      subject:`[LGPD] ${labels[data.type]} — ${data.name.replace(/[\r\n]/g, ' ')}`,
      html:`<h2>Solicitação LGPD recebida</h2><p><strong>Nome:</strong> ${escapeHtml(data.name)}</p><p><strong>E-mail:</strong> ${escapeHtml(data.email)}</p><p><strong>Tipo:</strong> ${escapeHtml(labels[data.type])}</p><p><strong>Descrição:</strong></p><p>${escapeHtml(data.description).replace(/\r?\n/g,'<br>')}</p><hr><p style="color:#888;font-size:12px">Responda em até 15 dias úteis conforme Art. 18 da LGPD.</p>`,
    })
    return { success:true }
  } catch { return { success:false, error:'Erro ao enviar solicitação. Tente novamente.' } }
}
