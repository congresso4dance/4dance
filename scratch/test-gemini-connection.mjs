import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testGemini() {
  const apiKey = process.env.GOOGLE_AI_STUDIO_KEY || process.env.NEXT_PUBLIC_GOOGLE_AI_STUDIO_KEY;
  if (!apiKey) {
    console.error("Key not found");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    console.log("Testando conexão com Gemini...");
    const result = await model.generateContent("Diga 'OK' se você consegue me ouvir.");
    console.log("Resposta do Gemini:", result.response.text());
    console.log("--- SUCESSO! A CHAVE ESTÁ DESBLOQUEADA! ---");
  } catch (err) {
    console.error("ERRO NA CONEXÃO:", err.message);
  }
}

testGemini();
