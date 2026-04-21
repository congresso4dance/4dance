'use strict';

import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Server Action para verificação de Elite usando Gemini 2.0 Flash.
 * Realiza a conferência visual das fotos sugeridas pela busca vetorial.
 * Inclui retry automático para lidar com rate limits (429).
 */
export async function verifyFacesWithAI(referenceBase64: string, candidateUrls: string[]) {
  try {
    // Tentar ambas as versões da chave (com e sem prefixo)
    const apiKey = process.env.GOOGLE_AI_STUDIO_KEY || process.env.NEXT_PUBLIC_GOOGLE_AI_STUDIO_KEY;
    
    if (!apiKey) {
      console.error("ERRO CRÍTICO: Chave de IA não encontrada.");
      return { 
        success: false, 
        error: "Chave de IA não configurada. Verifique o .env.local." 
      };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Preparar a selfie de referência
    const referencePart = {
      inlineData: {
        data: referenceBase64.split(',')[1], // Remover o prefixo data:image/...
        mimeType: "image/jpeg"
      }
    };

    // Buscar as imagens candidatas e converter para Base64
    // Limitamos a 10 para reduzir consumo de tokens e evitar rate limit
    const topCandidates = candidateUrls.slice(0, 10);
    
    console.log(`[AI] Verificando ${topCandidates.length} candidatas com Gemini 2.0 Flash...`);

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
Compare a PRIMEIRA imagem enviada (REFERÊNCIA) com as outras imagens (CANDIDATAS). 
Identifique quais das imagens candidatas contêm a mesma pessoa da referência. 

Considere o seguinte:
1. Ignore variações de iluminação, pose, acessórios (óculos, chapéus) ou expressões faciais (sorrisos, caretas).
2. Foque em traços permanentes: formato dos olhos, nariz, distância entre as pupilas e estrutura do queixo.
3. Se você identificar traços que confirmam ser a mesma pessoa com boa confiança, inclua no resultado.
4. Rejeite apenas se tiver certeza de que se trata de OUTRA pessoa.

Retorne APENAS um objeto JSON no seguinte formato:
{"indices": [0, 2, 5]}

Onde os números no array são a posição da imagem na lista de candidatas (começando do 0).
Se nenhuma imagem for um match plausível, retorne {"indices": []}.
NÃO responda com nenhum texto, apenas o JSON puro.`;

    // Retry automático com backoff para lidar com rate limits (429)
    let lastError: unknown = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await model.generateContent([prompt, referencePart, ...candidateParts]);
        const responseText = result.response.text();
        
        console.log(`[AI] Resposta do Gemini (tentativa ${attempt}):`, responseText);

        // Tentar limpar a resposta caso o Gemini coloque markdown ```json
        const cleanJson = responseText.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleanJson);

        // Mapear os índices de volta para as URLs originais que deram match
        const matchedUrls = parsed.indices.map((idx: number) => topCandidates[idx]);

        console.log(`[AI] ${matchedUrls.length} matches confirmados pela IA.`);

        return { 
          success: true, 
          matches: matchedUrls 
        };
      } catch (retryError: any) {
        lastError = retryError;
        const isRateLimit = retryError?.message?.includes('429') || retryError?.message?.includes('quota');
        
        if (isRateLimit && attempt < 3) {
          const waitTime = attempt * 15; // 15s, 30s
          console.warn(`[AI] Rate limit atingido. Aguardando ${waitTime}s antes da tentativa ${attempt + 1}...`);
          await new Promise(r => setTimeout(r, waitTime * 1000));
        } else {
          throw retryError;
        }
      }
    }

    throw lastError;
  } catch (error) {
    console.error("Erro na verificação AI Gemini:", error);
    return { success: false, error: "AI Verification Failed" };
  }
}
