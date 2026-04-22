import { useRef, useState, useCallback, useMemo } from 'react';

export function useMagnetic(intensity = 0.5) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!ref.current) return;

    const { clientX, clientY } = e;
    const { width, height, left, top } = ref.current.getBoundingClientRect();

    const x = clientX - (left + width / 2);
    const y = clientY - (top + height / 2);

    // Only apply if within a certain distance (e.g. 100px)
    const distance = Math.sqrt(x * x + y * y);
    const radius = 100;

    if (distance < radius) {
      setPosition({ x: x * intensity, y: y * intensity });
    } else {
      setPosition({ x: 0, y: 0 });
    }
  }, [intensity]);

  const handleMouseLeave = useCallback(() => {
    setPosition({ x: 0, y: 0 });
  }, []);

  return { ref, position, handleMouseMove, handleMouseLeave };
}
