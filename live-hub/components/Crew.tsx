'use client';
import { useHub } from '@/lib/HubContext';
import { ImageSlot } from './ImageSlot';

const PHOTOS: (string | null)[] = ['/assets/ilia/night-lounge-graded.png', null, null];
const SLOT_IDS = ['crew-ilia', 'crew-gtr', 'crew-new'];

export function Crew() {
  const { t } = useHub();
  return (
    <section data-screen-label="crew" style={{ maxWidth: 1280, margin: '56px auto 0', padding: '0 clamp(14px,4vw,28px)' }}>
      <h2 style={{ fontFamily: "'Inter Tight',sans-serif", fontWeight: 700, fontSize: 21, letterSpacing: '.03em', margin: 0, color: '#ECE9E4' }}>{t.crewTitle}</h2>
      <div className="crew-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12, marginTop: 22 }}>
        {t.crew.map((c, idx) => {
          const img = PHOTOS[idx];
          return (
            <div key={c.name} style={{ border: '1px solid #26262B', background: '#101013' }}>
              <div style={{ height: 260, position: 'relative', background: '#0D0D0F' }}>
                {img
                  ? <div style={{ position: 'absolute', inset: 0, backgroundImage: `url('${img}')`, backgroundSize: 'cover', backgroundPosition: 'center 30%' }} role="img" aria-label={c.name} />
                  : <ImageSlot id={SLOT_IDS[idx]} shape="rect" placeholder={c.ph} />}
              </div>
              <div style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ fontFamily: "'Inter Tight',sans-serif", fontWeight: 900, fontSize: 19, color: '#ECE9E4' }}>{c.name}</div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, letterSpacing: '.2em', color: '#E5372C' }}>{c.role}</div>
                </div>
                <div style={{ fontSize: 13.5, lineHeight: 1.6, color: '#A8A6AD', marginTop: 10 }}>{c.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
