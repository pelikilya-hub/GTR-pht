'use client';
import { useState } from 'react';
import { useHub } from '@/lib/HubContext';
import { ls } from '@/lib/storage';
import { fireWebhook } from '@/lib/webhooks';
import { SectionHead } from './ui/Motion';

export interface Car { id: string; name: string; year: string; city: string; stage: string; paid: string; note: string; img: string; ts: number }

export function Cars() {
  const { t, lang, notify, auth, now } = useHub();
  const ru = lang === 'ru';
  const garage = ls<Car[]>('gtrpht_garage', []);
  const [tip, setTip] = useState({ car: '', where: '', price: '', contact: '' });
  const [sent, setSent] = useState(false);
  void now; // re-render on the hub ticker so garage updates from the server show up

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tip.car.trim().length < 3 || tip.contact.trim().length < 3) { notify(t.carsTipErr); return; }
    fireWebhook('car_tip', { ...tip, member: auth.me?.nick || 'anon' });
    setTip({ car: '', where: '', price: '', contact: '' });
    setSent(true);
    notify(t.carsTipOk);
  };

  return (
    <section className="sec" id="cars" data-screen-label="cars">
      <div className="wrap">
        <SectionHead kicker={t.carsKicker} title={<>{t.carsTitle.split(' ').slice(0, -1).join(' ')} <em>{t.carsTitle.split(' ').slice(-1)}</em></>} lead={t.carsLead} />

        <div className="car-flow">
          {t.carsSteps.map((s, i) => (
            <div key={s.t} className="panel car-step rv" style={{ ['--d' as string]: `${i * 0.06}s` }}>
              <span className="num">0{i + 1}</span>
              <span className="dot" style={{ background: i === 0 ? 'var(--red-2)' : undefined }} />
              <h4>{s.t}</h4>
              <div style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--ink-2)' }}>{s.d}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(380px,100%),1fr))', gap: 16, marginTop: 16, alignItems: 'start' }}>
          <div className="rv">
            <div className="meta" style={{ marginTop: 18 }}>{t.carsGarage} · {garage.length}</div>
            {garage.length === 0 ? (
              <div className="panel" style={{ padding: 28, marginTop: 16, display: 'flex', gap: 18, alignItems: 'center' }}>
                <svg width="64" height="40" viewBox="0 0 64 40" fill="none" stroke="var(--ink-4)" strokeWidth="1.5" aria-hidden>
                  <path d="M6 28h52M10 28l5-11c1-2 3-3 5-3h22c2 0 4 1 5 3l7 11" /><circle cx="18" cy="30" r="5" /><circle cx="46" cy="30" r="5" />
                </svg>
                <div style={{ color: 'var(--ink-2)', fontSize: 14.5, lineHeight: 1.6 }}>{t.carsEmpty}</div>
              </div>
            ) : (
              <div className="garage">
                {garage.map((c) => (
                  <article key={c.id} className="panel car-card">
                    <div className="img">
                      {c.img ? <img src={c.img} alt={c.name} loading="lazy" /> : (
                        <svg viewBox="0 0 320 200" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} aria-hidden>
                          <defs><linearGradient id={'g' + c.id} x1="0" x2="1"><stop offset="0" stopColor="#e5372c" stopOpacity=".55" /><stop offset="1" stopColor="#e5372c" stopOpacity="0" /></linearGradient></defs>
                          <path d="M40 130h240M58 130l22-40c4-8 11-12 20-12h96c9 0 16 4 21 11l32 41" fill="none" stroke={'url(#g' + c.id + ')'} strokeWidth="3" />
                          <circle cx="98" cy="134" r="16" fill="none" stroke="#3a3940" strokeWidth="3" /><circle cx="226" cy="134" r="16" fill="none" stroke="#3a3940" strokeWidth="3" />
                          <text x="160" y="178" textAnchor="middle" fill="#3a3940" fontFamily="JetBrains Mono, monospace" fontSize="10" letterSpacing="3">PHOTO SOON</text>
                        </svg>
                      )}
                      <span className={'chip' + (c.stage === 'done' ? ' on' : '')} style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(8,8,10,.7)' }}>{t.carStages[c.stage] || c.stage}</span>
                    </div>
                    <div style={{ padding: 18 }}>
                      <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 21, letterSpacing: '-.02em' }}>{c.name} <span style={{ color: 'var(--ink-3)', fontWeight: 600 }}>{c.year}</span></div>
                      <div className="meta" style={{ marginTop: 6 }}>{c.city}{c.paid ? ' · ' + (ru ? 'КУПЛЕНА ЗА ' : 'BOUGHT FOR ') + c.paid : ''}</div>
                      {c.note && <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--ink-2)', margin: '10px 0 0' }}>{c.note}</p>}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <form className="glass rv" onSubmit={submit} style={{ padding: 26, marginTop: 18, ['--d' as string]: '.1s' }}>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 28, letterSpacing: '-.02em' }}>{t.carsTipTitle}</div>
            <p style={{ color: 'var(--ink-2)', fontSize: 14.5, lineHeight: 1.6, margin: '8px 0 18px' }}>{t.carsTipLead}</p>
            <div style={{ display: 'grid', gap: 10 }}>
              <input className="field" value={tip.car} onChange={(e) => setTip({ ...tip, car: e.target.value })} placeholder={t.carsTipCar} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <input className="field" value={tip.where} onChange={(e) => setTip({ ...tip, where: e.target.value })} placeholder={t.carsTipWhere} />
                <input className="field" value={tip.price} onChange={(e) => setTip({ ...tip, price: e.target.value })} placeholder={t.carsTipPrice} />
              </div>
              <input className="field" value={tip.contact} onChange={(e) => setTip({ ...tip, contact: e.target.value })} placeholder={t.carsTipContact} />
              <button className="btn btn-red" type="submit" style={{ width: '100%' }}>{sent ? '✓ ' : ''}{t.carsTipBtn}</button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
