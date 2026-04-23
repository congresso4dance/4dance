"use client";

import styles from '../fotografo.module.css';
import { Globe, Construction } from 'lucide-react';

export default function PhotographerSite() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', opacity: 0.5 }}>
      <Construction size={48} style={{ marginBottom: '1rem' }} />
      <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Em Construção</h2>
      <p>Em breve você poderá personalizar seu site próprio aqui.</p>
    </div>
  );
}
