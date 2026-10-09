'use client';
import { useHub } from '@/lib/HubContext';
import { GtrDeity } from './GtrDeity';

export function GtrReality() {
  const { t } = useHub();
  return (
    <section data-screen-label="gtr-reality" id="gtr-reality" style={{ borderTop: '1px solid #1C1C20', borderBottom: '1px solid #1C1C20', background: '#0B0B0D', marginTop: 64, padding: '64px clamp(14px,4vw,28px)' }}>
      <div className="gtr-reality-grid" style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(280px,5fr) minmax(300px,7fr)', gap: 48, alignItems: 'center' }}>
        <div className="gtr-deity-buddha-wrap" style={{ position: 'relative', height: 640 }}>
          <GtrDeity variant="buddha" />
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: -6, textAlign: 'center', fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, letterSpacing: '.3em', color: '#3E3E46' }}>FORM 01 · BUDDHA · SIGNAL DECODING</div>
        </div>
        <div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, letterSpacing: '.3em', color: '#8E8C94' }}>GTR — GLOBAL TRANSFORMATION REALITY</div>
          <h2 style={{ fontFamily: "'Unbounded',sans-serif", fontWeight: 900, fontSize: 'clamp(24px,3.4vw,38px)', lineHeight: 1.14, letterSpacing: '.01em', color: '#ECE9E4', margin: '14px 0 0' }}>{t.gtrTitle}</h2>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: '#A8A6AD', margin: '18px 0 0', maxWidth: 560 }}>{t.gtrLead}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 12, marginTop: 28 }}>
            {t.gtrCards.map((gc) => (
              <div key={gc.code} style={{ border: '1px solid #26262B', background: '#101013', padding: 20 }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, letterSpacing: '.24em', color: '#55545C' }}>{gc.code}</div>
                <div style={{ fontFamily: "'Unbounded',sans-serif", fontWeight: 700, fontSize: 15, color: '#ECE9E4', marginTop: 10 }}>{gc.title}</div>
                <div style={{ fontSize: 13, lineHeight: 1.6, color: '#8E8C94', marginTop: 8 }}>{gc.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ border: '1px solid #3A1512', background: 'linear-gradient(90deg,#1A0F0E,#111114 60%)', padding: '22px 24px', marginTop: 14, display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, letterSpacing: '.24em', color: '#FF6A5B' }}>{t.gtrGoodCode}</div>
              <div style={{ fontFamily: "'Unbounded',sans-serif", fontWeight: 700, fontSize: 16, color: '#ECE9E4', marginTop: 8 }}>{t.gtrGoodTitle}</div>
              <div style={{ fontSize: 13, lineHeight: 1.6, color: '#A8A6AD', marginTop: 8 }}>{t.gtrGoodDesc}</div>
            </div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 34, color: '#E5372C' }}>☸</div>
          </div>
        </div>
      </div>
      <div className="gtr-reality-forms-outer gtr-forms-grid" style={{ maxWidth: 1280, margin: '56px auto 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(320px,100%),1fr))', gap: 12 }}>
        {t.gtrForms.map((gf) => (
          <div key={gf.variant} style={{ border: '1px solid #1C1C20', background: '#0D0D0F', position: 'relative', height: 460 }}>
            <GtrDeity variant={gf.variant} style={{ inset: 10 }} />
            <div style={{ position: 'absolute', left: 14, bottom: 10, fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, letterSpacing: '.26em', color: '#3E3E46' }}>{gf.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
