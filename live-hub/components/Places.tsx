'use client';
import { useState } from 'react';
import { useHub } from '@/lib/HubContext';
import { ls, setLs } from '@/lib/storage';
import { PLACE_SRCS } from '@/lib/i18n';
import { SectionHead } from './ui/Motion';
import { fireWebhook } from '@/lib/webhooks';

interface QuizState { votes: Record<number, number>; mine: number | null }

export function Places() {
  const { t, notify, bump: hubBump, journey, now, lang } = useHub();
  const ru = lang === 'ru';
  const [, setGen] = useState(0);
  const cdon = ls<Record<number, number>>('gtrpht_citydon', {});
  const cquiz = ls<Record<number, QuizState>>('gtrpht_quiz', {});

  const cityDon = (i: number, amt: number) => {
    const d = ls<Record<number, number>>('gtrpht_citydon', {});
    d[i] = (+d[i] || 0) + amt;
    setLs('gtrpht_citydon', d);
    notify(ru ? `+${amt} ฿ — комфорт этапа растёт` : `+${amt} ฿ — leg comfort rising`);
    fireWebhook('city_donate', { placeIndex: i, place: t.places[i]?.name, amount: amt });
    setGen((g) => g + 1); hubBump();
  };

  const quizVote = (i: number, oi: number) => {
    const q = ls<Record<number, QuizState>>('gtrpht_quiz', {});
    const cur: QuizState = q[i] || { votes: {}, mine: null };
    if (cur.mine === oi) return;
    if (cur.mine != null) cur.votes[cur.mine] = Math.max(0, (+cur.votes[cur.mine] || 1) - 1);
    cur.votes[oi] = (+cur.votes[oi] || 0) + 1;
    cur.mine = oi;
    q[i] = cur;
    setLs('gtrpht_quiz', q);
    setGen((g) => g + 1); hubBump();
  };

  const places = t.places.map((p, i) => {
    const qd = t.cityQuiz[i] || { opts: [], q: '', goal: 20000 };
    const don = +cdon[i] || 0, goal = qd.goal || 20000;
    const pct = Math.min(100, (don / goal) * 100);
    const lvl = t.comfortLvls[Math.min(t.comfortLvls.length - 1, Math.floor(pct / 25))];
    const qs = cquiz[i] || { votes: {}, mine: null };
    const totVotes = Object.keys(qs.votes || {}).reduce((a, k) => a + (+qs.votes[+k] || 0), 0);
    return {
      ...p, imgs: PLACE_SRCS[i] || [], dates: journey.stages[i]?.dates || '', state: journey.stages[i]?.state || 'wait',
      donFmt: '฿ ' + don.toLocaleString('en-US'), goalFmt: '฿ ' + goal.toLocaleString('en-US'),
      pct: pct.toFixed(1) + '%', lvl, quick: [100, 500, 1000], q: qd.q,
      opts: (qd.opts || []).map((o, oi) => {
        const n = +qs.votes?.[oi] || 0;
        const pq = totVotes ? Math.round((n / totVotes) * 100) : 0;
        const on = qs.mine === oi;
        return { label: o, pctLbl: qs.mine != null ? pq + '%' : '', w: (qs.mine != null ? pq : 0) + '%', on, col: on ? '#FF6A5B' : '#B9B6BE', bc: on ? '#E5372C' : '#26262B', oi };
      }),
    };
  });

  return (
    <section className="sec" id="places" data-screen-label="places">
      <div className="wrap">
        <SectionHead kicker={t.plSub} title={t.plTitle} />
        <div className="places">
          {places.map((pl, i) => {
            const frame = Math.floor(now / 6000 + i) % Math.max(1, pl.imgs.length);
            return (
              <article key={i} className="panel place rv" style={{ ['--d' as string]: `${(i % 4) * 0.06}s` }}>
                <div className="ph">
                  {pl.imgs.map((src, k) => <img key={src} src={'/' + src} alt="" loading="lazy" className={k === frame ? 'on' : ''} style={{ animationDelay: `${-k * 4}s` }} />)}
                  <div className="cap">
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className={'chip' + (pl.state === 'active' ? ' on' : '')} style={{ height: 26, background: 'rgba(8,8,10,.55)' }}>{pl.dates}</span>
                      <span className="chip" style={{ height: 26, background: 'rgba(8,8,10,.55)', color: pl.tagCol }}>{pl.tag}</span>
                    </div>
                    <h4>{pl.name}</h4>
                  </div>
                </div>
                <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: 'var(--ink-2)' }}>{pl.desc}</p>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <span className="meta" style={{ fontSize: 9.5 }}>{t.comfortLbl}</span>
                      <span className="meta" style={{ fontSize: 9.5, color: 'var(--red-2)' }}>{pl.lvl}</span>
                    </div>
                    <div className="bar" style={{ marginTop: 10 }}><i style={{ width: pl.pct }} /></div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 10, alignItems: 'center' }}>
                      {pl.quick.map((a) => <button key={a} className="chip" style={{ cursor: 'pointer', height: 30 }} onClick={() => cityDon(i, a)}>+{a} ฿</button>)}
                      <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', marginLeft: 'auto' }}>{pl.donFmt}</span>
                    </div>
                  </div>
                  <div style={{ marginTop: 'auto' }}>
                    <div className="meta" style={{ fontSize: 9.5 }}>{t.quizLbl}</div>
                    <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 16, margin: '8px 0 10px' }}>{pl.q}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {pl.opts.map((o) => (
                        <button key={o.oi} onClick={() => quizVote(i, o.oi)} style={{ position: 'relative', overflow: 'hidden', textAlign: 'left', padding: '10px 12px', borderRadius: 10, border: `1px solid ${o.on ? 'var(--red)' : 'var(--line-2)'}`, background: 'rgba(255,255,255,.02)', color: o.on ? '#fff' : 'var(--ink-2)', cursor: 'pointer', fontSize: 13.5, minHeight: 40 }}>
                          <span style={{ position: 'absolute', inset: 0, width: o.w, background: 'rgba(229,55,44,.16)', transition: 'width .8s var(--ease)' }} />
                          <span style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', gap: 8 }}><span>{o.label}</span><span className="mono" style={{ fontSize: 11 }}>{o.pctLbl}</span></span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
