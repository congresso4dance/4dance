'use strict';

import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Server Action para verificação de Elite usando Gemini 1.5 Flash.
 * Realiza a conferência visual das fotos sugeridas pela busca vetorial.
 */
export async function verifyFacesWithAI(referenceBase64: string, candidateUrls: string[]) {
  try {
    const apiKey = process.env.GOOGLE_AI_STUDIO_KEY;
    if (!apiKey) {
      console.error("GOOGLE_AI_STUDIO_KEY não configurada.");
      return { success: false, error: "AI Key missing" };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Preparar a selfie de referência
    const referencePart = {
      inlineData: {
        data: referenceBase64.split(',')[1], // Remover o prefixo data:image/...
        mimeType: "image/jpeg"
      }
    };

    // Buscar as imagens candidatas e converter para Base64
    // Limitamos a 10 fotos para manter performance e custos baixos no free tier
    const topCandidates = candidateUrls.slice(0, 10);
    
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

    const prompt = `Você é um especialista em reconhecimento facial de alta precisão. 
Compare a PRIMEIRA imagem enviada (REFERÊNCIA) com as outras imagens (CANDIDATAS). 
Identifique quais das imagens candidatas contêm EXATAMENTE a mesma pessoa da referência. 
Seja extremamente rigoroso. Se houver dúvida, não dê o match.

Retorne APENAS um objeto JSON no seguinte formato:
{"indices": [0, 2, 5]}

Onde os números no array são a posição da imagem na lista de candidatas (começando do 0).
Se nenhuma imagem for um match perfeito, retorne {"indices": []}.
NÃO responda com nenhum texto, apenas o JSON puro.`;

    const result = await model.generateContent([prompt, referencePart, ...candidateParts]);
    const responseText = result.response.text();
    
    // Tentar limpar a resposta caso o Gemini coloque markdown ```json
    const cleanJson = responseText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    // Mapear os índices de volta para as URLs originais que deram match
    const matchedUrls = parsed.indices.map((idx: number) => topCandidates[idx]);

    return { 
      success: true, 
      matches: matchedUrls 
    };
  } catch (error) {
    console.error("Erro na verificação AI Gemini:", error);
    return { success: false, error: "AI Verification Failed" };
  }
}
