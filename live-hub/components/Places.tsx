'use client';
import { useState } from 'react';
import { useHub } from '@/lib/HubContext';
import { ls, setLs } from '@/lib/storage';
import { PLACE_SRCS } from '@/lib/i18n';
import { GtrMatrixPhoto } from './GtrMatrixPhoto';
import { fireWebhook } from '@/lib/webhooks';

interface QuizState { votes: Record<number, number>; mine: number | null }

export function Places() {
  const { t, notify, bump: hubBump } = useHub();
  const [, setGen] = useState(0);
  const cdon = ls<Record<number, number>>('gtrpht_citydon', {});
  const cquiz = ls<Record<number, QuizState>>('gtrpht_quiz', {});

  const cityDon = (i: number, amt: number) => {
    const d = ls<Record<number, number>>('gtrpht_citydon', {});
    d[i] = (+d[i] || 0) + amt;
    setLs('gtrpht_citydon', d);
    notify(`+${amt} ฿ — комфорт этапа растёт (демо до шлюза)`);
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
      ...p, srcs: (PLACE_SRCS[i] || []).join(','),
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
    <section data-screen-label="places" style={{ maxWidth: 1280, margin: '64px auto 0', padding: '0 clamp(14px,4vw,28px)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
        <h2 style={{ fontFamily: "'Unbounded',sans-serif", fontWeight: 700, fontSize: 21, letterSpacing: '.03em', margin: 0, color: '#ECE9E4', flex: 1 }}>{t.plTitle}</h2>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '.2em', color: '#55545C' }}>{t.plSub}</div>
      </div>
      <div className="places-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(300px,100%),1fr))', gap: 12, marginTop: 22 }}>
        {places.map((pl, i) => (
          <div key={pl.name} style={{ border: '1px solid #26262B', background: '#101013' }}>
            <div style={{ height: 220, position: 'relative', background: '#0D0D0F', overflow: 'hidden' }}>
              <GtrMatrixPhoto id={`place-${i}`} srcs={pl.srcs} interval={7000} />
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'repeating-linear-gradient(0deg,transparent 0px,transparent 2px,rgba(11,11,12,.08) 2px,rgba(11,11,12,.08) 4px)', mixBlendMode: 'multiply' }} />
              <div style={{ position: 'absolute', top: 10, left: 10, fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, letterSpacing: '.2em', color: '#ECE9E4', background: 'rgba(13,13,15,.82)', border: '1px solid #26262B', padding: '4px 8px' }}>{pl.day}</div>
            </div>
            <div style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ fontFamily: "'Unbounded',sans-serif", fontWeight: 700, fontSize: 16, color: '#ECE9E4', flex: 1 }}>{pl.name}</div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '.22em', color: pl.tagCol }}>{pl.tag}</div>
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.6, color: '#8E8C94', marginTop: 8 }}>{pl.desc}</div>
              <div style={{ borderTop: '1px solid #1E1E23', marginTop: 14, paddingTop: 12 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '.22em', color: '#55545C', flex: 1 }}>{t.comfortLbl}</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, letterSpacing: '.1em', color: '#FF6A5B' }}>{pl.lvl}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                  <div style={{ flex: 1, border: '1px solid #26262B', padding: 2 }}>
                    <div style={{ height: 6, background: '#141416', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: pl.pct, backgroundImage: 'repeating-linear-gradient(-45deg,#E5372C 0 8px,#C22B21 8px 16px)' }} />
                    </div>
                  </div>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, color: '#8E8C94', flex: 'none' }}>{pl.donFmt} <span style={{ color: '#3E3E46' }}>/ {pl.goalFmt}</span></span>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  {pl.quick.map((a) => (
                    <button key={a} onClick={() => cityDon(i, a)} style={{ background: 'none', border: '1px solid #26262B', color: '#8E8C94', fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, padding: '6px 10px', cursor: 'pointer' }}>+{a} ฿</button>
                  ))}
                </div>
              </div>
              <div style={{ borderTop: '1px solid #1E1E23', marginTop: 12, paddingTop: 12 }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '.22em', color: '#55545C' }}>{t.quizLbl}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#ECE9E4', marginTop: 8 }}>{pl.q}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                  {pl.opts.map((qo) => (
                    <button key={qo.oi} onClick={() => quizVote(i, qo.oi)} style={{ position: 'relative', overflow: 'hidden', background: '#0D0D0F', border: `1px solid ${qo.bc}`, color: qo.col, fontSize: 11.5, textAlign: 'left', padding: '8px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
                      <span style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: qo.w, background: 'rgba(229,55,44,.14)' }} />
                      <span style={{ position: 'relative', display: 'flex', gap: 8, justifyContent: 'space-between' }}><span>{qo.label}</span><span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, color: '#55545C' }}>{qo.pctLbl}</span></span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
