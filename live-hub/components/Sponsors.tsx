'use client';
import { useHub } from '@/lib/HubContext';
import { ImageSlot } from './ImageSlot';

export function Sponsors() {
  const { t } = useHub();
  const sponsors = [1, 2, 3].map((k) => ({ code: 'S-0' + k, slotId: 'sponsor-s' + k }));
  return (
    <section data-screen-label="sponsors" style={{ maxWidth: 1280, margin: '56px auto 0', padding: '0 clamp(14px,4vw,28px)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
        <h2 style={{ fontFamily: "'Inter Tight',sans-serif", fontWeight: 700, fontSize: 21, letterSpacing: '.03em', margin: 0, color: '#ECE9E4', flex: 1 }}>{t.spTitle}</h2>
        <a href="mailto:crew@gtrpht.live" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, letterSpacing: '.14em', color: '#FF6A5B' }}>{t.spCta}</a>
      </div>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '.2em', color: '#55545C', marginTop: 8 }}>{t.spSub}</div>
      <div className="sponsors-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12, marginTop: 22 }}>
        {sponsors.map((sp) => (
          <div key={sp.code} style={{ border: '1px dashed #2E2E34', padding: 10 }}>
            <div style={{ height: 110, position: 'relative' }}><ImageSlot id={sp.slotId} shape="rect" fit="contain" placeholder={t.spPh} /></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, padding: '0 4px 4px' }}>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '.16em', color: '#8E8C94' }}>{sp.code}</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '.16em', color: '#55545C' }}>{t.spFree}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
