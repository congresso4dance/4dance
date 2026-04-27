'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from '@/utils/supabase/server';

/**
 * Server Action para verificação de Elite usando Gemini 2.0 Flash.
 * 🔒 SEGURANÇA: Validado contra SSRF e Vazamento de Chaves.
 */
export async function verifyFacesWithAI(referenceBase64: string, candidateUrls: string[]) {
  try {
    // 🔒 SEGURANÇA: Garante que o usuário está logado
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Não autorizado");
    }

    // 🔒 SEGURANÇA: Chave NUNCA deve ser NEXT_PUBLIC_
    const apiKey = process.env.GOOGLE_AI_STUDIO_KEY;
    
    if (!apiKey) {
      return { success: false, error: "Chave de IA não configurada no servidor." };
    }

    // 🔒 SEGURANÇA: Proteção contra SSRF (Lei 12)
    // Apenas permite URLs vindas do próprio Supabase Storage
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const validatedUrls = candidateUrls.filter(url => {
        try {
            const u = new URL(url);
            return u.origin === new URL(supabaseUrl!).origin;
        } catch {
            return false;
        }
    });

    if (validatedUrls.length === 0 && candidateUrls.length > 0) {
        throw new Error("Tentativa de SSRF bloqueada: Domínio não permitido.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Preparar a selfie de referência
    const referencePart = {
      inlineData: {
        data: referenceBase64.split(',')[1],
        mimeType: "image/jpeg"
      }
    };

    // Limitar a 10 candidatas para economizar tokens
    const topCandidates = validatedUrls.slice(0, 10);
    console.log(`[AI] Verificando ${topCandidates.length} candidatas validadas...`);

    const candidateParts = await Promise.all(topCandidates.map(async (url) => {
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      return {
        inlineData: {
          data: base64,
          mimeType: "image/jpeg"
        }
      };
    }));

    const prompt = `Você é um especialista em reconhecimento facial. 
Compare a PRIMEIRA imagem (REFERÊNCIA) com as outras (CANDIDATAS). 
Identifique quais candidatas contêm a mesma pessoa da referência.

Regras:
1. Ignore iluminação, pose, acessórios ou expressões.
2. Foque em traços permanentes: olhos, nariz, distância pupilar, queixo.
3. Inclua se houver boa confiança. Rejeite apenas se for CERTAMENTE outra pessoa.

Retorne APENAS JSON: {"indices": [0, 2, 5]}
Se nenhum match: {"indices": []}`;

    const result = await model.generateContent([prompt, referencePart, ...candidateParts]);
    const responseText = result.response.text();
    
    const cleanJson = responseText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    const matchedUrls = parsed.indices.map((idx: number) => topCandidates[idx]);

    return { success: true, matches: matchedUrls };

  } catch (error: any) {
    console.warn("[AI] Erro na verificação:", error.message);
    return { success: false, error: error.message };
  }
}

