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
    <div className="panel" data-screen-label="boost" style={{ padding: 24, height: '100%' }}>
      <div className="meta">{t.boostTitle}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
        <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 24, letterSpacing: '-.02em', flex: 1 }}>{t.boostName}</div>
        <div className="mono" style={{ fontSize: 13, color: 'var(--red-2)' }}>{fmt(raised)} <span style={{ color: 'var(--ink-4)' }}>/ {fmt(GOAL)}</span></div>
      </div>
      <div className="bar" style={{ height: 6, marginTop: 16 }}><i style={{ width: boostPct + '%' }} /></div>
      <div className="seg" style={{ marginTop: 18 }}>
        {PRESETS.map((v) => <button key={v} className={v === sel ? 'on' : ''} onClick={() => setSel(v)}>{fmt(v)}</button>)}
      </div>
      <button className="btn btn-red" onClick={doDonate} style={{ width: '100%', marginTop: 16 }}>{t.donate} {fmt(sel)}</button>
      <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ink-3)', marginTop: 12 }}>{t.boostNote}</div>
    </div>
  );
}
