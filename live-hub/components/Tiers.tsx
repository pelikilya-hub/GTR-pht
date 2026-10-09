'use client';
import { useHub } from '@/lib/HubContext';

export function Tiers() {
  const { t, lang, notify } = useHub();
  const fmt = (n: number) => '฿' + n.toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US');

  return (
    <section id="tiers" data-screen-label="tiers" style={{ maxWidth: 1280, margin: '56px auto 0', padding: '0 clamp(14px,4vw,28px)' }}>
      <h2 style={{ fontFamily: "'Inter Tight',sans-serif", fontWeight: 700, fontSize: 21, letterSpacing: '.03em', margin: 0, color: '#ECE9E4' }}>{t.tiersTitle}</h2>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '.2em', color: '#55545C', marginTop: 8 }}>{t.tiersSub}</div>
      <div className="tiers-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 12, marginTop: 22 }}>
        {t.tiers.map((tr, idx) => {
          const popular = idx === 1;
          return (
            <div key={tr.name} style={{ position: 'relative', border: `1px solid ${popular ? '#E5372C' : '#26262B'}`, background: '#101013', padding: 26, boxShadow: popular ? '0 0 34px rgba(229,55,44,.16)' : 'none', display: 'flex', flexDirection: 'column' }}>
              {popular && (
                <div style={{ position: 'absolute', top: -9, left: 22, background: '#E5372C', color: '#0B0B0C', fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 600, letterSpacing: '.18em', padding: '4px 10px' }}>{t.popular}</div>
              )}
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, letterSpacing: '.24em', color: '#8E8C94' }}>{tr.name}</div>
              <div style={{ marginTop: 14 }}><span style={{ fontFamily: "'Inter Tight',sans-serif", fontWeight: 900, fontSize: 32, color: '#ECE9E4' }}>{fmt(tr.price)}</span><span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#55545C' }}> {t.perMonth}</span></div>
              <div style={{ fontSize: 13.5, color: '#A8A6AD', marginTop: 6 }}>{tr.desc}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 18, flex: 1 }}>
                {tr.perks.map((perk) => (
                  <div key={perk} style={{ display: 'flex', gap: 10, fontSize: 13.5, lineHeight: 1.5, color: '#B9B6BE' }}><span style={{ fontFamily: "'JetBrains Mono',monospace", color: '#E5372C' }}>+</span><span>{perk}</span></div>
                ))}
              </div>
              <button onClick={() => notify(t.toastPay)} style={{ width: '100%', marginTop: 22, background: popular ? '#E5372C' : 'transparent', border: `1px solid ${popular ? '#E5372C' : '#2E2E34'}`, color: popular ? '#0B0B0C' : '#ECE9E4', fontFamily: "'Inter Tight',sans-serif", fontWeight: 700, fontSize: 11.5, letterSpacing: '.08em', padding: 14, cursor: 'pointer' }}>{t.choose}</button>
            </div>
          );
        })}
      </div>
      <div style={{ border: '1px solid #26262B', background: '#111114', marginTop: 12, padding: 24, position: 'relative' }}>
        <div style={{ position: 'absolute', top: -1, left: -1, width: 14, height: 14, borderTop: '2px solid #E5372C', borderLeft: '2px solid #E5372C' }} />
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, letterSpacing: '.22em', color: '#8E8C94' }}>{t.clubTitle}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '10px 24px', marginTop: 14 }}>
          {t.club.map((ci) => (
            <div key={ci} style={{ display: 'flex', gap: 10, fontSize: 13.5, lineHeight: 1.5, color: '#A8A6AD' }}><span style={{ fontFamily: "'JetBrains Mono',monospace", color: '#E5372C' }}>▸</span><span>{ci}</span></div>
          ))}
        </div>
      </div>
    </section>
  );
}
