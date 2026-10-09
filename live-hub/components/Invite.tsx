'use client';
import { useState } from 'react';
import { useHub } from '@/lib/HubContext';
import { ls, setLs } from '@/lib/storage';
import { fireWebhook } from '@/lib/webhooks';

const inputStyle: React.CSSProperties = { background: '#0D0D0F', border: '1px solid #26262B', color: '#ECE9E4', padding: '12px 14px', fontSize: 14, fontFamily: 'inherit', width: '100%', boxSizing: 'border-box', outline: 'none' };

export function Invite() {
  const { t, notify } = useHub();
  const [name, setName] = useState('');
  const [place, setPlace] = useState('');
  const [offer, setOffer] = useState('');
  const [contact, setContact] = useState('');
  const [msg, setMsg] = useState('');

  const send = () => {
    if (!name.trim() || !contact.trim()) { notify(t.invErr); return; }
    const list = ls<Record<string, unknown>[]>('gtrpht_invites', []);
    list.push({ name: name.trim(), place: place.trim(), offer, contact: contact.trim(), msg: msg.trim(), ts: Date.now() });
    setLs('gtrpht_invites', list);
    fireWebhook('invite_submit', { name: name.trim(), place: place.trim(), offer, contact: contact.trim(), msg: msg.trim() });
    setName(''); setPlace(''); setContact(''); setMsg(''); setOffer('');
    notify(t.toastInv);
  };

  return (
    <section data-screen-label="invite" id="invite" style={{ borderTop: '1px solid #1C1C20', background: '#0B0B0D', marginTop: 64, padding: '64px clamp(14px,4vw,28px)' }}>
      <div className="invite-grid" style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(320px,100%),1fr))', gap: 48, alignItems: 'start' }}>
        <div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, letterSpacing: '.3em', color: '#FF6A5B' }}>{t.invKicker}</div>
          <h2 style={{ fontFamily: "'Inter Tight',sans-serif", fontWeight: 900, fontSize: 'clamp(24px,3vw,34px)', lineHeight: 1.15, color: '#ECE9E4', margin: '14px 0 0' }}>{t.invTitle}</h2>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: '#A8A6AD', margin: '18px 0 0', maxWidth: 520 }}>{t.invLead}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 26 }}>
            {t.invPoints.map((ip) => (
              <div key={ip.n} style={{ display: 'flex', gap: 12, fontSize: 13.5, lineHeight: 1.55, color: '#A8A6AD' }}><span style={{ fontFamily: "'JetBrains Mono',monospace", color: '#E5372C' }}>{ip.n}</span><span>{ip.txt}</span></div>
            ))}
          </div>
        </div>
        <div style={{ border: '1px solid #26262B', background: '#101013', padding: 26, position: 'relative' }}>
          <div style={{ position: 'absolute', top: -1, right: -1, width: 14, height: 14, borderTop: '2px solid #E5372C', borderRight: '2px solid #E5372C' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t.invFName} style={inputStyle} />
            <input value={place} onChange={(e) => setPlace(e.target.value)} placeholder={t.invFPlace} style={inputStyle} />
            <div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, letterSpacing: '.22em', color: '#55545C', marginBottom: 8 }}>{t.invFOffer}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {t.invOfferList.map((o) => {
                  const on = offer === o;
                  return <button key={o} onClick={() => setOffer(on ? '' : o)} style={{ background: 'none', border: `1px solid ${on ? '#E5372C' : '#2A2A30'}`, color: on ? '#FF6A5B' : '#8E8C94', fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, letterSpacing: '.12em', padding: '8px 12px', cursor: 'pointer' }}>{o}</button>;
                })}
              </div>
            </div>
            <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder={t.invFContact} style={inputStyle} />
            <textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={t.invFMsg} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            <button onClick={send} style={{ background: '#E5372C', border: 'none', color: '#0D0D0F', fontFamily: "'Inter Tight',sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: '.08em', padding: '15px 18px', cursor: 'pointer' }}>{t.invSendBtn}</button>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, letterSpacing: '.14em', color: '#55545C', lineHeight: 1.6 }}>{t.invNote}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
