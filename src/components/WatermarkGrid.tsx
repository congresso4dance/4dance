import React from 'react';

interface WatermarkGridProps {
  opacity?: number;
}

export default function WatermarkGrid({ opacity = 0.35 }: WatermarkGridProps) {
  // Ultra-Performance Watermark:
  // Em vez de injetar 48 imagens pesadas com observers para CADA foto (destruindo a RAM),
  // utilizamos uma máscara nativa de repetição do CSS empurrada para GPU
  return (
    <div 
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 10,
        overflow: 'hidden',
        userSelect: 'none',
        opacity: opacity,
        mixBlendMode: 'overlay', // Funde com a foto lindamente
      }}
    >
      <div 
        style={{
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          transform: 'rotate(-30deg)',
          backgroundImage: 'url("/logo/Logo l 4dance_BRANCA.png")',
          backgroundSize: '160px',
          backgroundRepeat: 'space',
          filter: 'grayscale(1) brightness(2)',
        }}
      />
    </div>
  );
}
