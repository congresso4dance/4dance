/**
 * 🔒 4DANCE ELITE: SECURITY REGRESSION TESTS
 * Objetivo: Garantir que nenhuma alteração futura quebre as travas de segurança.
 *
 * Mocka `@/utils/supabase/server` e `@google/generative-ai` pra rodar sem
 * depender de sessão real do Supabase nem de chamada de verdade pra API do
 * Gemini — assim o teste é determinístico e seguro de rodar em CI.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockUser: { id: string } | null = null;

vi.mock('@/utils/supabase/server', () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: mockUser } }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: { role: 'admin' } }),
        }),
      }),
    }),
  }),
}));

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel() {
      return {
        generateContent: async () => ({
          response: { text: () => '{"indices": []}' },
        }),
      };
    }
  },
}));

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://pxvcgautbaobysvhyfzi.supabase.co';
process.env.GOOGLE_AI_STUDIO_KEY = 'test-key';

import { verifyFacesWithAI } from '@/app/actions/ai-verification';
import { resetAllIndexing } from '@/app/actions/ai-engine';

describe('🛡️ Auditoria de Regressão de Segurança', () => {
  beforeEach(() => {
    mockUser = null;
  });

  describe('VULN-02: Server Actions Auth', () => {
    it('deve bloquear reset de indexação se não houver sessão', async () => {
      await expect(resetAllIndexing()).rejects.toThrow(/Não autorizado|Sessão não encontrada/);
    });
  });

  describe('VULN-03: SSRF Protection', () => {
    it('deve rejeitar URLs fora do domínio permitido (Supabase)', async () => {
      mockUser = { id: 'test-user' };
      const maliciousUrls = [
        'http://localhost:3000/admin',
        'http://169.254.169.254/latest/meta-data/',
        'https://google.com',
      ];

      // verifyFacesWithAI nunca rejeita (captura os próprios erros e resolve
      // com { success: false, error }), então validamos o retorno, não uma
      // rejeição de promise.
      const result = await verifyFacesWithAI('data:image/jpeg;base64,fake', maliciousUrls);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/SSRF detectada|Domínio não permitido/);
    });

    it('deve aceitar URLs legítimas do Supabase', async () => {
      mockUser = { id: 'test-user' };
      const fetchSpy = vi
        .spyOn(global, 'fetch')
        .mockResolvedValue({ arrayBuffer: async () => new ArrayBuffer(8) } as Response);

      const legitimateUrls = ['https://pxvcgautbaobysvhyfzi.supabase.co/storage/v1/object/public/photos/test.jpg'];
      const result = await verifyFacesWithAI('data:image/jpeg;base64,fake', legitimateUrls);

      // Pode "falhar" por outro motivo, mas nunca por domínio bloqueado.
      if (!result.success) {
        expect(result.error).not.toMatch(/SSRF detectada|Domínio não permitido/);
      }

      fetchSpy.mockRestore();
    });
  });

  describe('VULN-04: Secret Leakage', () => {
    it('não deve utilizar variáveis NEXT_PUBLIC para chaves privadas', () => {
      expect(process.env.NEXT_PUBLIC_GOOGLE_AI_STUDIO_KEY).toBeUndefined();
    });
  });
});
