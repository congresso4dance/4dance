/**
 * 🔒 4DANCE ELITE: SECURITY REGRESSION TESTS
 * Objetivo: Garantir que nenhuma alteração futura quebre as travas de segurança.
 */

import { verifyFacesWithAI } from '@/app/actions/ai-verification';
import { resetAllIndexing } from '@/app/actions/ai-engine';

// Mock do Supabase e Environment
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://pxvcgautbaobysvhyfzi.supabase.co';
process.env.GOOGLE_AI_STUDIO_KEY = 'test-key';

describe('🛡️ Auditoria de Regressão de Segurança', () => {
  
  describe('VULN-02: Server Actions Auth', () => {
    it('deve bloquear reset de indexação se não houver sessão', async () => {
      // Mock de falha na sessão
      await expect(resetAllIndexing()).rejects.toThrow(/Não autorizado|Sessão não encontrada/);
    });
  });

  describe('VULN-03: SSRF Protection', () => {
    it('deve rejeitar URLs fora do domínio permitido (Supabase)', async () => {
      const maliciousUrls = [
        'http://localhost:3000/admin',
        'http://169.254.169.254/latest/meta-data/',
        'https://google.com'
      ];
      
      // Simula chamada com selfie fake e URLs maliciosas
      await expect(verifyFacesWithAI('data:image/jpeg;base64,fake', maliciousUrls))
        .rejects.toThrow(/SSRF detectada|Domínio não permitido/);
    });

    it('deve aceitar URLs legítimas do Supabase', async () => {
        const legitimateUrls = ['https://pxvcgautbaobysvhyfzi.supabase.co/storage/v1/object/public/photos/test.jpg'];
        // Não deve lançar erro de SSRF (pode falhar por outros motivos como auth, mas não por SSRF)
        try {
            await verifyFacesWithAI('data:image/jpeg;base64,fake', legitimateUrls);
        } catch (e: any) {
            expect(e.message).not.toMatch(/SSRF detectada|Domínio não permitido/);
        }
    });
  });

  describe('VULN-04: Secret Leakage', () => {
    it('não deve utilizar variáveis NEXT_PUBLIC para chaves privadas', () => {
      expect(process.env.NEXT_PUBLIC_GOOGLE_AI_STUDIO_KEY).toBeUndefined();
    });
  });
});
