/**
 * Utilitário para aplicação de marca d'água em imagens antes do upload.
 */

export async function applyWatermark(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Não foi possível obter o contexto do canvas'));
          return;
        }

        // Definir dimensões
        canvas.width = img.width;
        canvas.height = img.height;

        // Desenhar imagem original
        ctx.drawImage(img, 0, 0);

        // Configurar marca d'água (Texto por padrão, mas pode ser imagem)
        const watermarkText = '4DANCE';
        const fontSize = Math.floor(canvas.width / 15);
        ctx.font = `bold ${fontSize}px Inter, sans-serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Desenhar marca d'água em padrão repetido (tiling)
        const stepX = fontSize * 5;
        const stepY = fontSize * 3;

        ctx.rotate(-20 * Math.PI / 180); // Inclinar a marca d'água

        for (let x = -canvas.width; x < canvas.width * 2; x += stepX) {
          for (let y = -canvas.height; y < canvas.height * 2; y += stepY) {
            ctx.fillText(watermarkText, x, y);
          }
        }

        // Resetar rotação para desenhar algo fixo se necessário
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        // Opcional: Adicionar logo no canto inferior
        // Aqui poderíamos carregar o 'Logo l 4dance_BRANCA.png' e desenhar

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Erro ao gerar blob da imagem'));
          }
        }, 'image/jpeg', 0.8);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}
