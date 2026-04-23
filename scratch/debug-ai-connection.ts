import { getPendingPhotos } from '../src/app/actions/ai-engine';

async function test() {
    console.log("🚀 Testando conexão com o motor de IA...");
    try {
        const photos = await getPendingPhotos(5);
        console.log("✅ Conexão estabelecida com sucesso!");
        console.log(`📸 Recebi ${photos.length} fotos pendentes.`);
        console.log("Exemplo:", photos[0]);
    } catch (err: any) {
        console.error("❌ ERRO DETECTADO:");
        console.error("Mensagem:", err.message);
        console.error("Detalhes:", err.details);
        console.error("Dica:", err.hint);
    }
}

test();
