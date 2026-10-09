'use client';
import Link from 'next/link';
import { useHub } from '@/lib/HubContext';

export function Footer() {
  const { t } = useHub();
  return (
    <footer style={{ borderTop: '1px solid #1C1C20', marginTop: 64, padding: '36px clamp(14px,4vw,28px) calc(100px + env(safe-area-inset-bottom,0px))', textAlign: 'center' }}>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, letterSpacing: '.26em', color: '#E5372C' }}>{t.f1}</div>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '.1em', color: '#55545C', marginTop: 10 }}>{t.f2}</div>
      <Link href="/credits/" style={{ display: 'inline-block', fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '.14em', color: '#3E3D44', marginTop: 12 }}>PHOTO CREDITS · WIKIMEDIA COMMONS</Link>
    </footer>
  );
}
