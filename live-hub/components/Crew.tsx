'use client';
import { useHub } from '@/lib/HubContext';
import { GtrDeity } from './GtrDeity';
import { SectionHead } from './ui/Motion';

// Real portraits go to public/assets/crew/<id>.jpg; until then each card shows a generative glyph portrait.
const ART = ['ilia', 'wai', 'chedi'];

export function Crew() {
  const { t } = useHub();
  return (
    <section className="sec" id="crew" data-screen-label="crew">
      <div className="wrap">
        <SectionHead kicker="CREW" title={t.crewTitle} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(300px,100%),1fr))', gap: 14 }}>
          {t.crew.map((c, idx) => (
            <article key={c.name} className="panel rv" style={{ overflow: 'hidden', ['--d' as string]: `${idx * 0.06}s` }}>
              <div style={{ height: 340, position: 'relative', background: '#09090b' }}>
                {idx === 0
                  ? <img src="/assets/crew/ilia-bangla.jpg" alt={c.name} loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 18%' }} />
                  : <GtrDeity variant={ART[idx] || 'ilia'} />}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,transparent 55%,rgba(8,8,10,.95))' }} />
                <div style={{ position: 'absolute', left: 22, bottom: 18 }}>
                  <div className="kicker" style={{ fontSize: 10 }}>{c.role}</div>
                  <div style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 40, letterSpacing: '-.04em', lineHeight: 1, marginTop: 8 }}>{c.name}</div>
                </div>
              </div>
              <p style={{ padding: '18px 22px 24px', margin: 0, fontSize: 15, lineHeight: 1.6, color: 'var(--ink-2)' }}>{c.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
