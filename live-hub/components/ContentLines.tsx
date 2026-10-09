'use client';
import { useHub } from '@/lib/HubContext';
import { SectionHead } from './ui/Motion';

export function ContentLines() {
  const { t } = useHub();
  return (
    <section className="sec" id="lines" data-screen-label="content-lines">
      <div className="wrap">
        <SectionHead kicker={t.lnSub} title={t.lnTitle} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(360px,100%),1fr))', gap: '0 32px', borderTop: '1px solid var(--line)' }}>
          {t.lines.map((ln, i) => (
            <div key={ln.code} className="rv" style={{ padding: '28px 26px 30px 0', borderBottom: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 12, minHeight: 230, ['--d' as string]: `${(i % 3) * 0.06}s` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22, lineHeight: 1 }} aria-hidden>{['🧘', '🔥', '🏝️', '🎧', '🏎️', '🤝'][i] || '◆'}</span>
                <span className="meta" style={{ color: ln.accent }}>{ln.code}</span>
              </div>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 'clamp(28px,2.6vw,38px)', letterSpacing: '-.035em', lineHeight: 1, overflowWrap: 'anywhere' }}>{ln.title}</div>
              <div style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--ink-2)', flex: 1, maxWidth: 380 }}>{ln.desc}</div>
              <div className="meta" style={{ fontSize: 9.5 }}>{ln.foot}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
