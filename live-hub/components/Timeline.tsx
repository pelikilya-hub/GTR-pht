'use client';
import { useHub } from '@/lib/HubContext';

export function Timeline() {
  const { t, journey } = useHub();
  return (
    <section data-screen-label="timeline" style={{ maxWidth: 1280, margin: '56px auto 0', padding: '0 clamp(14px,4vw,28px)' }}>
      <h2 style={{ fontFamily: "'Unbounded',sans-serif", fontWeight: 700, fontSize: 21, letterSpacing: '.03em', margin: 0, color: '#ECE9E4' }}>{t.tlTitle}</h2>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '.2em', color: '#55545C', marginTop: 8 }}>{t.tlSub}</div>
      <div className="timeline-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(290px,100%),1fr))', gap: 12, marginTop: 22 }}>
        {journey.stages.map((st) => (
          <div key={st.n} style={{ border: `1px solid ${st.bc}`, background: '#101013', padding: 20, boxShadow: st.shadow }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: "'Unbounded',sans-serif", fontWeight: 900, fontSize: 22, color: st.nCol }}>{st.n}</span>
              <span style={{ flex: 1 }} />
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '.16em', color: st.chipCol, border: `1px solid ${st.chipBc}`, padding: '4px 9px' }}>{st.status}</span>
            </div>
            <div style={{ fontFamily: "'Unbounded',sans-serif", fontWeight: 700, fontSize: 15, color: '#ECE9E4', marginTop: 12, lineHeight: 1.35 }}>{st.title}</div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, letterSpacing: '.08em', color: '#8E8C94', marginTop: 8 }}>{st.dates}</div>
            <div style={{ fontSize: 13.5, color: '#A8A6AD', marginTop: 6 }}>{st.base}</div>
            <div style={{ borderTop: '1px solid #1E1E23', marginTop: 14, paddingTop: 10, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '.06em', color: '#55545C' }}>→ {st.leg}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
