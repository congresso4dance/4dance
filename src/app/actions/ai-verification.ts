'use strict';

import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Server Action para verificação de Elite usando Gemini 2.0 Flash.
 * Falha rápido para ativar o fallback vetorial se o Gemini estiver indisponível.
 */
export async function verifyFacesWithAI(referenceBase64: string, candidateUrls: string[]) {
  try {
    const apiKey = process.env.GOOGLE_AI_STUDIO_KEY || process.env.NEXT_PUBLIC_GOOGLE_AI_STUDIO_KEY;
    
    if (!apiKey) {
      return { success: false, error: "Chave de IA não configurada." };
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
    const topCandidates = candidateUrls.slice(0, 10);
    console.log(`[AI] Verificando ${topCandidates.length} candidatas...`);

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

    // UMA tentativa apenas - falha rápido para ativar o fallback
    const result = await model.generateContent([prompt, referencePart, ...candidateParts]);
    const responseText = result.response.text();
    
    console.log(`[AI] Resposta:`, responseText);

    const cleanJson = responseText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    const matchedUrls = parsed.indices.map((idx: number) => topCandidates[idx]);

    console.log(`[AI] ${matchedUrls.length} matches confirmados.`);
    return { success: true, matches: matchedUrls };

  } catch (error) {
    console.warn("[AI] Gemini indisponível, ativando fallback vetorial:", error);
    return { success: false, error: "Gemini indisponível" };
  }
}
