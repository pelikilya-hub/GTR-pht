'use client';
import { useHub } from '@/lib/HubContext';
import { SectionHead } from './ui/Motion';

export function Tiers() {
  const { t, lang, notify, integrations } = useHub();
  const fmt = (n: number) => '฿' + n.toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US');
  const choose = (price: number) => {
    if (integrations.payUrl) {
      const url = integrations.payUrl.includes('{amt}') ? integrations.payUrl.split('{amt}').join(String(price)) : integrations.payUrl;
      try { window.open(url, '_blank'); } catch { /* ignore */ }
      notify(t.toastPay);
    } else notify(lang === 'ru' ? 'Подписка откроется вместе со стартом тура' : 'Subscriptions open with the tour start');
  };
  return (
    <section className="sec" id="tiers" data-screen-label="tiers">
      <div className="wrap">
        <SectionHead kicker={t.tiersSub} title={t.tiersTitle} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(300px,100%),1fr))', gap: 14 }}>
          {t.tiers.map((tr, idx) => {
            const pop = idx === 1;
            return (
              <div key={tr.name} className={(pop ? 'glass' : 'panel') + ' rv'} style={{ padding: 28, display: 'flex', flexDirection: 'column', position: 'relative', borderColor: pop ? 'rgba(229,55,44,.55)' : undefined, boxShadow: pop ? '0 30px 80px -30px rgba(229,55,44,.45)' : undefined, ['--d' as string]: `${idx * 0.06}s` }}>
                {pop && <span className="chip on" style={{ position: 'absolute', top: 18, right: 18, height: 26, fontSize: 9 }}>{t.popular}</span>}
                <div className="meta">{tr.name}</div>
                <div style={{ marginTop: 18, display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 52, letterSpacing: '-.04em', lineHeight: 1 }}>{fmt(tr.price)}</span>
                  <span className="meta">{t.perMonth}</span>
                </div>
                <div style={{ fontSize: 15, color: 'var(--ink-2)', marginTop: 8 }}>{tr.desc}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22, flex: 1 }}>
                  {tr.perks.map((perk) => (
                    <div key={perk} style={{ display: 'flex', gap: 12, fontSize: 14.5, lineHeight: 1.5, color: 'var(--ink-2)' }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" style={{ flex: 'none', marginTop: 2 }} fill="none" stroke="var(--red-2)" strokeWidth="1.8"><path d="M3 8.5l3 3 7-7" /></svg>
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>
                <button className={'btn' + (pop ? ' btn-red' : '')} style={{ width: '100%', marginTop: 26 }} onClick={() => choose(tr.price)}>{t.choose}</button>
              </div>
            );
          })}
        </div>
        <div className="panel rv" style={{ marginTop: 14, padding: 26 }}>
          <div className="meta">{t.clubTitle}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(240px,100%),1fr))', gap: '12px 28px', marginTop: 16 }}>
            {t.club.map((ci) => <div key={ci} style={{ display: 'flex', gap: 10, fontSize: 14.5, lineHeight: 1.5, color: 'var(--ink-2)' }}><span style={{ color: 'var(--red-2)' }}>▸</span><span>{ci}</span></div>)}
          </div>
        </div>
      </div>
    </section>
  );
}
