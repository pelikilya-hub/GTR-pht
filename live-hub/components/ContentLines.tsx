'use client';
import { useHub } from '@/lib/HubContext';

export function ContentLines() {
  const { t } = useHub();
  return (
    <section data-screen-label="content-lines" style={{ maxWidth: 1280, margin: '64px auto 0', padding: '0 clamp(14px,4vw,28px)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
        <h2 style={{ fontFamily: "'Inter Tight',sans-serif", fontWeight: 700, fontSize: 21, letterSpacing: '.03em', margin: 0, color: '#ECE9E4', flex: 1 }}>{t.lnTitle}</h2>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '.2em', color: '#55545C' }}>{t.lnSub}</div>
      </div>
      <div className="content-lines-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 12, marginTop: 22 }}>
        {t.lines.map((ln) => (
          <div key={ln.code} style={{ border: '1px solid #26262B', borderTop: `2px solid ${ln.accent}`, background: '#101013', padding: 22, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 190 }}>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, letterSpacing: '.26em', color: ln.accent }}>{ln.code}</div>
            <div style={{ fontFamily: "'Inter Tight',sans-serif", fontWeight: 900, fontSize: 19, color: '#ECE9E4' }}>{ln.title}</div>
            <div style={{ fontSize: 13, lineHeight: 1.6, color: '#8E8C94', flex: 1 }}>{ln.desc}</div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '.2em', color: '#55545C' }}>{ln.foot}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
