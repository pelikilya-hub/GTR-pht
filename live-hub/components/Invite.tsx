'use client';
import { useState } from 'react';
import { useHub } from '@/lib/HubContext';
import { ls, setLs } from '@/lib/storage';
import { fireWebhook } from '@/lib/webhooks';
import { SectionHead } from './ui/Motion';



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
    <section className="sec" id="invite" data-screen-label="invite">
      <div className="wrap" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(360px,100%),1fr))', gap: 'clamp(28px,5vw,72px)', alignItems: 'start' }}>
        <div>
          <SectionHead kicker={t.invKicker} title={t.invTitle} lead={t.invLead} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderTop: '1px solid var(--line)' }}>
            {t.invPoints.map((ip, i) => (
              <div key={ip.n} className="rv" style={{ display: 'flex', gap: 18, padding: '18px 0', borderBottom: '1px solid var(--line)', fontSize: 15, lineHeight: 1.55, color: 'var(--ink-2)', ['--d' as string]: `${i * 0.06}s` }}>
                <span style={{ fontFamily: 'var(--display)', fontWeight: 800, color: 'var(--red-2)' }}>{ip.n}</span><span>{ip.txt}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="glass rv" style={{ padding: 28, marginTop: 'clamp(0px,4vw,48px)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder={t.invFName} />
            <input className="field" value={place} onChange={(e) => setPlace(e.target.value)} placeholder={t.invFPlace} />
            <div>
              <div className="meta" style={{ margin: '6px 0 10px' }}>{t.invFOffer}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {t.invOfferList.map((o) => <button key={o} className={'chip' + (offer === o ? ' on' : '')} style={{ cursor: 'pointer', height: 36 }} onClick={() => setOffer(offer === o ? '' : o)}>{o}</button>)}
              </div>
            </div>
            <input className="field" value={contact} onChange={(e) => setContact(e.target.value)} placeholder={t.invFContact} />
            <textarea className="field" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={t.invFMsg} rows={3} />
            <button className="btn btn-red" onClick={send} style={{ width: '100%' }}>{t.invSendBtn}</button>
            <div className="meta" style={{ fontSize: 9.5, lineHeight: 1.6 }}>{t.invNote}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
