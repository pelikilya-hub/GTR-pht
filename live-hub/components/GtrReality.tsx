'use client';
import { useHub } from '@/lib/HubContext';
import { GtrDeity } from './GtrDeity';
import { SectionHead } from './ui/Motion';

export function GtrReality() {
  const { t } = useHub();
  return (
    <section className="sec" id="gtr-reality" data-screen-label="gtr-reality">
      <div className="wrap">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(380px,100%),1fr))', gap: 'clamp(24px,5vw,72px)', alignItems: 'center' }}>
          <div className="rv" style={{ position: 'relative', height: 'clamp(380px,60vw,680px)' }}>
            <GtrDeity variant="buddha" />
            <div className="meta" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, textAlign: 'center', fontSize: 9.5, color: 'var(--ink-4)' }}>FORM 01 · BUDDHA · SIGNAL DECODING</div>
          </div>
          <div>
            <SectionHead kicker="GTR — GLOBAL TRANSFORMATION REALITY" title={t.gtrTitle} lead={t.gtrLead} />
            <div style={{ borderTop: '1px solid var(--line)' }}>
              {t.gtrCards.map((gc, i) => (
                <div key={gc.code} className="rv" style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 16, padding: '20px 0', borderBottom: '1px solid var(--line)', ['--d' as string]: `${i * 0.06}s` }}>
                  <span className="meta" style={{ paddingTop: 4 }}>{gc.code}</span>
                  <div>
                    <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 20, letterSpacing: '-.02em' }}>{gc.title}</div>
                    <div style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--ink-2)', marginTop: 6 }}>{gc.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="glass rv" style={{ padding: '22px 24px', marginTop: 20, display: 'flex', gap: 18, alignItems: 'center', borderColor: 'rgba(90,169,255,.35)' }}>
              <div style={{ flex: 1 }}>
                <div className="meta" style={{ color: 'var(--blue)' }}>{t.gtrGoodCode}</div>
                <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 19, marginTop: 8 }}>{t.gtrGoodTitle}</div>
                <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ink-2)', marginTop: 6 }}>{t.gtrGoodDesc}</div>
              </div>
              <div style={{ fontSize: 40, color: 'var(--blue)', animation: 'spin 18s linear infinite' }}>☸</div>
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(260px,100%),1fr))', gap: 14, marginTop: 'clamp(40px,6vw,80px)' }}>
          {t.gtrForms.map((gf, i) => (
            <div key={gf.variant} className="rv" style={{ position: 'relative', height: 420, borderRadius: 'var(--radius)', overflow: 'hidden', background: 'radial-gradient(80% 60% at 50% 40%, rgba(229,55,44,.07), transparent 70%)', ['--d' as string]: `${i * 0.06}s` }}>
              <GtrDeity variant={gf.variant} style={{ inset: 10 }} />
              <div className="meta" style={{ position: 'absolute', left: 16, bottom: 12, fontSize: 9, color: 'var(--ink-4)' }}>{gf.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
