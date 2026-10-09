'use client';
import { useHub } from '@/lib/HubContext';
import { SectionHead } from './ui/Motion';

export function Sponsors() {
  const { t, lang } = useHub();
  const ru = lang === 'ru';
  const slots = ru
    ? [['S-01', 'Борт машины', 'Логотип на GTR в каждом кадре перегона'], ['S-02', 'Оверлей эфира', 'Плашка в прямом эфире и в повторах'], ['S-03', 'Точка маршрута', 'Нативная остановка у партнёра в эфире']]
    : [['S-01', 'Car livery', 'Your logo on the GTR in every road shot'], ['S-02', 'Stream overlay', 'A bar on the live stream and replays'], ['S-03', 'Route stop', 'A native stop at your place, on air']];
  return (
    <section className="sec" id="sponsors" data-screen-label="sponsors">
      <div className="wrap">
        <SectionHead kicker={t.spSub} title={t.spTitle} right={<a className="btn btn-sm" href="#invite">{t.spCta}</a>} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(280px,100%),1fr))', gap: 14 }}>
          {slots.map(([code, title, desc], i) => (
            <div key={code} className="panel rv" style={{ padding: 24, borderStyle: 'dashed', ['--d' as string]: `${i * 0.06}s` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="meta">{code}</span><span className="meta" style={{ color: 'var(--red-2)' }}>{t.spFree}</span></div>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 24, letterSpacing: '-.02em', marginTop: 22 }}>{title}</div>
              <div style={{ fontSize: 14.5, lineHeight: 1.55, color: 'var(--ink-2)', marginTop: 8 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
