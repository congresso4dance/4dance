import React from 'react';
import Image from 'next/image';

interface WatermarkGridProps {
  opacity?: number;
}

export default function WatermarkGrid({ opacity = 0.4 }: WatermarkGridProps) {
  // We'll use a repeated background pattern for performance and "un-removability"
  return (
    <div 
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 10,
        overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
        gridTemplateRows: 'repeat(auto-fill, minmax(100px, 1fr))',
        gap: '20px',
        padding: '20px',
        opacity: opacity,
        mixBlendMode: 'overlay',
        userSelect: 'none'
      }}
    >
      {Array.from({ length: 48 }).map((_, i) => (
        <div 
          key={i} 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            transform: 'rotate(-30deg)'
          }}
        >
          <Image 
            src="/logo/Logo l 4dance_BRANCA.png" 
            alt="" 
            width={80} 
            height={27}
            style={{ filter: 'grayscale(1) brightness(2)' }}
          />
        </div>
      ))}
    </div>
  );
}
