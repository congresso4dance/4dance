import { createClient } from './supabase/server';

export async function logAdminAction(action: string, details: any = {}) {
  const supabase = await createClient();
  
  // Pegar usuário atual
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return;

  // Tentar inserir no log de auditoria
  // A tabela pode ser 'admin_logs' ou 'audit_logs', verifiquei que existe 'admin_logs' no dashboard
  try {
    await supabase.from('admin_logs').insert({
      admin_id: user.id,
      admin_email: user.email,
      action,
      details,
      ip_address: 'internal-server-action' // Em Server Actions é difícil pegar o IP real sem headers complexos
    });
  } catch (error) {
    console.error('Falha ao gravar log de auditoria:', error);
  }
}
