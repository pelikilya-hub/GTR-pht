'use client';
import Link from 'next/link';
import Script from 'next/script';

// Crew-only pages share this minimal shell: same brand chrome, no hub chrome.
export function CrewShell({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <>
      <Script src="/vendor/gtr-rtc.js" strategy="afterInteractive" />
      <div style={{ minHeight: '100vh', background: '#0B0B0C', color: '#ECE9E4', fontFamily: "'Inter',sans-serif", padding: 'clamp(12px,3vw,28px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 16 }}>
            <Link href="/" style={{ fontFamily: "'Inter Tight',sans-serif", fontWeight: 900, fontSize: 16, letterSpacing: '.05em', color: '#ECE9E4' }}>GTR<span style={{ color: '#E5372C' }}>|</span>PHT</Link>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, letterSpacing: '.18em', color: '#55545C' }}>{sub}</span>
            <span style={{ flex: 1 }} />
            <Link href="/" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '.14em', color: '#FF6A5B' }}>← ХАБ</Link>
          </div>
          <h1 style={{ fontFamily: "'Inter Tight',sans-serif", fontWeight: 900, fontSize: 'clamp(20px,3vw,28px)', margin: '0 0 16px', color: '#ECE9E4' }}>{title}</h1>
          {children}
        </div>
      </div>
    </>
  );
}
