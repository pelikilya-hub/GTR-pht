'use client';
import { useState } from 'react';
import { useHub } from '@/lib/HubContext';
import { fireWebhook } from '@/lib/webhooks';

const PRESETS = [100, 500, 1500, 5000];
const GOAL = 150000;
const RAISED_SEED = 9240; // frontend-only seed; a real payment webhook should drive this in production

export function BoostPanel() {
  const { t, lang, notify, integrations, auth } = useHub();
  const [sel, setSel] = useState(500);
  const fmt = (n: number) => '฿' + n.toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US');
  const raised = Math.min(GOAL, RAISED_SEED);
  const boostPct = Math.round((raised / GOAL) * 100);

  const doDonate = () => {
    if (integrations.payUrl) {
      const url = integrations.payUrl.includes('{amt}') ? integrations.payUrl.split('{amt}').join(String(sel)) : integrations.payUrl;
      try { window.open(url, '_blank'); } catch { /* ignore */ }
      notify(t.toastPay);
    } else {
      notify(lang === 'ru' ? 'Платёжная ссылка не настроена — задай её в консоли (ПЛАТЕЖИ)' : 'Payment link not set — configure it in the console (PAYMENTS)');
    }
    fireWebhook('boost_donate', { amount: sel, currency: 'THB', member: auth.me?.nick || 'anon' });
  };

  return (
    <div className="drone-card" data-screen-label="boost">
      <div className="drone-shot gtr-hover">
        <img src="/assets/drone/01.jpg" alt="" loading="lazy" />
        <div className="laser" />
        <div className="hud hud-tl"><span className="g">REC</span> ● 4K·60</div>
        <div className="hud hud-tr g">46:00 MIN</div>
        <div className="hud hud-bl g">ALT 120M · 20KM LINK</div>
        <div className="hud hud-br">{t.boostTitle.replace('// ', '')}</div>
        <i className="br tl" /><i className="br tr" /><i className="br bl" /><i className="br brr" />
      </div>
      <div style={{ padding: '20px 0 0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 'clamp(22px,2.4vw,30px)', letterSpacing: '-.02em', textTransform: 'uppercase', flex: 1 }}>{t.boostName}</div>
          <div className="g" style={{ fontSize: 20, color: 'var(--red-2)' }}>{fmt(raised)} <span style={{ color: 'var(--ink-4)' }}>/ {fmt(GOAL)}</span></div>
        </div>
        <div className="bar" style={{ height: 6, marginTop: 14 }}><i style={{ width: boostPct + '%' }} /></div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
          <div className="seg">{PRESETS.map((v) => <button key={v} className={v === sel ? 'on' : ''} onClick={() => setSel(v)}>{fmt(v)}</button>)}</div>
          <button className="btn btn-red" onClick={doDonate} style={{ flex: 1, minWidth: 200 }}>{t.donate} {fmt(sel)}</button>
        </div>
        <div style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-3)', marginTop: 12 }}>{t.boostNote}</div>
      </div>
    </div>
  );
}
