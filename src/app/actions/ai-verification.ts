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
      console.error("ERRO CRÍTICO: GOOGLE_AI_STUDIO_KEY não encontrada no process.env");
      // Fallback para log detalhado (sem expor a chave)
      return { 
        success: false, 
        error: "Chave de IA não configurada no servidor. Por favor, verifique o arquivo .env.local e reinicie o servidor." 
      };
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
    // Usamos o Top 20 completo vindo da busca vetorial
    const topCandidates = candidateUrls.slice(0, 20);
    
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
