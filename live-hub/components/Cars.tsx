'use client';
import { useState } from 'react';
import { useHub } from '@/lib/HubContext';
import { ls } from '@/lib/storage';
import { fireWebhook } from '@/lib/webhooks';
import { SectionHead } from './ui/Motion';

export interface Car { id: string; name: string; year: string; city: string; stage: string; paid: string; note: string; img: string; ts: number }

const SHOTS: [string, string, string][] = [
  ['/assets/cars/01.jpg', 'Кладбище машин', 'Car graveyard'],
  ['/assets/cars/02.jpg', 'Разборка · ряды кузовов', 'Breaker yard'],
  ['/assets/cars/03.jpg', 'R34 GT-R на аукционе', 'R34 GT-R at auction'],
  ['/assets/cars/04.jpg', 'Supra за забором', 'Supra behind the fence'],
  ['/assets/cars/05.jpg', 'Штрафстоянка', 'Impound lot'],
  ['/assets/cars/06.jpg', 'Находка в сарае', 'Barn find'],
  ['/assets/cars/07.jpg', 'Горы запчастей · Бангкок', 'Parts piles · Bangkok'],
  ['/assets/cars/08.jpg', '911 у обочины', '911 by the curb'],
  ['/assets/cars/09.jpg', 'RX-7 под снегом', 'RX-7 in the snow'],
];

// A garage card without its own photo gets a gallery shot of the same model, never a random one.
const MODEL_SHOT: [RegExp, number][] = [[/supra/i, 3], [/skyline|gt-?r|r3[234]/i, 2], [/911|porsche/i, 7], [/rx-?7|mazda/i, 8]];
const NEUTRAL = [0, 1, 4, 5, 6]; // graveyard, breaker yard, impound, barn, parts — no specific model
function shotFor(name: string, i: number) {
  const hit = MODEL_SHOT.find(([re]) => re.test(name));
  return SHOTS[hit ? hit[1] : NEUTRAL[i % NEUTRAL.length]][0];
}

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
        <SectionHead kicker={t.carsKicker} title={t.carsTitle} lead={t.carsLead} />

        <div className="car-mosaic">
          {SHOTS.map(([src, ruCap, enCap], i) => (
            <figure key={src} className="car-shot rv" style={{ ['--d' as string]: `${(i % 5) * 0.05}s` }}>
              <img src={src} alt={ru ? ruCap : enCap} loading="lazy" />
              <figcaption><span className="g">#{String(i + 1).padStart(2, '0')}</span> {ru ? ruCap : enCap}</figcaption>
            </figure>
          ))}
        </div>

        <div className="car-flow">
          {t.carsSteps.map((s, i) => (
            <div key={s.t} className="panel car-step rv" style={{ ['--d' as string]: `${i * 0.06}s` }}>
              <span className="num">0{i + 1}</span>
              <span style={{ fontSize: 26, lineHeight: 1 }} aria-hidden>{['🔎', '🤝', '🔧', '⚙️', '🏁'][i]}</span>
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
                      <img src={c.img || shotFor(c.name, garage.indexOf(c))} alt={c.name} loading="lazy" />
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
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><span style={{ fontSize: 28 }} aria-hidden>🏎️</span><div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 28, letterSpacing: '-.02em', textTransform: 'uppercase' }}>{t.carsTipTitle}</div></div>
            <p style={{ color: 'var(--ink-2)', fontSize: 14.5, lineHeight: 1.6, margin: '8px 0 18px' }}>{t.carsTipLead}</p>
            <div style={{ display: 'grid', gap: 10 }}>
              <input className="field" value={tip.car} onChange={(e) => setTip({ ...tip, car: e.target.value })} placeholder={t.carsTipCar} />
              <div className="tip-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
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
