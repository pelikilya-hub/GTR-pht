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
    <div data-screen-label="boost" style={{ border: '1px solid #26262B', background: '#101013', padding: 22 }}>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, letterSpacing: '.22em', color: '#8E8C94' }}>{t.boostTitle}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginTop: 14 }}>
        <div style={{ fontFamily: "'Inter Tight',sans-serif", fontWeight: 700, fontSize: 17, color: '#ECE9E4', flex: 1 }}>{t.boostName}</div>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: '#FF6A5B' }}>{fmt(raised)} <span style={{ color: '#55545C' }}>/ {fmt(GOAL)}</span></div>
      </div>
      <div style={{ marginTop: 14, border: '1px solid #2A2A30', padding: 3 }}>
        <div style={{ height: 10, background: '#141416', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: boostPct + '%', backgroundImage: 'repeating-linear-gradient(-45deg,#E5372C 0 10px,#C22B21 10px 20px)', backgroundSize: '28px 28px', animation: 'omStripe 1.2s linear infinite', boxShadow: '0 0 12px rgba(229,55,44,.7)' }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
        {PRESETS.map((v) => (
          <button key={v} onClick={() => setSel(v)} style={{ background: 'none', border: `1px solid ${v === sel ? '#E5372C' : '#2A2A30'}`, color: v === sel ? '#FF6A5B' : '#A8A6AD', fontFamily: "'JetBrains Mono',monospace", fontSize: 11.5, padding: '9px 14px', cursor: 'pointer' }}>{fmt(v)}</button>
        ))}
      </div>
      <button onClick={doDonate} style={{ width: '100%', marginTop: 14, background: '#E5372C', border: '1px solid #E5372C', color: '#0B0B0C', fontFamily: "'Inter Tight',sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: '.08em', padding: 15, cursor: 'pointer' }}>{t.donate} {fmt(sel)}</button>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '.04em', lineHeight: 1.7, color: '#55545C', marginTop: 12 }}>{t.boostNote}</div>
    </div>
  );
}
