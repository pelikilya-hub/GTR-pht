'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useHub } from '@/lib/HubContext';
import { ls, setLs } from '@/lib/storage';
import { fireWebhook } from '@/lib/webhooks';

interface FeedItem { side: 'good' | 'joy'; who: string; amt: number; ts: number }
interface ScalesData { good: number; joy: number; votes: number; feed: FeedItem[] }

function defaultData(): ScalesData {
  const now = Date.now(), h = 3600000;
  return {
    good: 34500, joy: 41200, votes: 186,
    feed: [
      { side: 'joy', who: 'Аноним', amt: 5000, ts: now - 0.4 * h },
      { side: 'good', who: 'Марина К.', amt: 3000, ts: now - 1.6 * h },
      { side: 'joy', who: 'dr1ft_ph', amt: 1000, ts: now - 2.9 * h },
      { side: 'good', who: 'Аноним', amt: 10000, ts: now - 6 * h },
      { side: 'good', who: 'Тимур', amt: 500, ts: now - 11 * h },
    ],
  };
}
function readData(): ScalesData {
  const d = ls<ScalesData | null>('gtrpht_scales', null);
  if (d && d.feed) return d;
  return defaultData();
}
function saveData(d: ScalesData) { setLs('gtrpht_scales', d); }

const SPARKS = Array.from({ length: 7 }, (_, i) => ({ x: (6 + i * 13 + (i % 3) * 4) + '%', dur: (2.6 + (i % 4) * 0.55).toFixed(2) + 's', delay: (i * 0.42).toFixed(2) + 's' }));

function tier(sum: number, cur: number, label: string) {
  const done = cur >= sum, pct = Math.min(100, Math.round((cur / sum) * 100));
  return {
    sum: sum >= 1000 ? (Math.round(sum / 100) / 10).toFixed(1).replace('.0', '') + 'K ₽' : sum + ' ₽',
    label, pct: pct + '%', state: done ? 'ОТКРЫТО' : pct + '%',
    brd: done ? '#2A4E80' : '#1E1E23', bg: done ? 'rgba(74,158,255,.05)' : '#101013',
    sumCol: done ? '#8FC4FF' : '#6E6C74', txtCol: done ? '#ECE9E4' : '#8E8C94', stCol: done ? '#4A9EFF' : '#4A4950',
  };
}
function tierJ(sum: number, cur: number, label: string) {
  const t = tier(sum, cur, label);
  if (cur >= sum) { t.brd = '#6E2A24'; t.bg = 'rgba(229,55,44,.05)'; t.sumCol = '#FF8A7C'; t.stCol = '#FF6A5B'; }
  return t;
}
function ago(ts: number): string {
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return 'сейчас';
  if (m < 60) return m + ' мин';
  const h = Math.round(m / 60);
  return h < 24 ? h + ' ч' : Math.round(h / 24) + ' дн';
}

export function Scales() {
  const { auth, notify, openAuth, bump: hubBump } = useHub();
  const [gen, setGen] = useState(0);
  // gen is a version counter forcing re-reads of localStorage after donate/vote actions.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const data = useMemo(() => readData(), [gen]);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const tiltRef = useRef<HTMLDivElement | null>(null);
  const gGlowRef = useRef<HTMLDivElement | null>(null);
  const jGlowRef = useRef<HTMLDivElement | null>(null);
  const gemRef = useRef<HTMLDivElement | null>(null);
  const haloRef = useRef<HTMLDivElement | null>(null);
  const beamGRef = useRef<HTMLDivElement | null>(null);
  const beamJRef = useRef<HTMLDivElement | null>(null);
  const gNumRef = useRef<HTMLDivElement | null>(null);
  const jNumRef = useRef<HTMLDivElement | null>(null);
  const gPctRef = useRef<HTMLDivElement | null>(null);
  const jPctRef = useRef<HTMLDivElement | null>(null);
  const totNumRef = useRef<HTMLSpanElement | null>(null);
  const coinLayerRef = useRef<HTMLDivElement | null>(null);

  interface Phys { a: number; v: number; target: number; gDisp: number | null; jDisp: number | null; gTarget: number; jTarget: number; last: number; gemKey?: string }
  const physRef = useRef<Phys | null>(null);
  const seenRef = useRef(false);
  const glowTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sync = () => {
    const P = physRef.current;
    if (!P) return;
    const d = readData();
    const g = +d.good || 0, j = +d.joy || 0, tot = g + j || 1;
    P.gTarget = g; P.jTarget = j;
    P.target = Math.max(-13, Math.min(13, (j / tot - g / tot) * 26));
  };

  const coin = (side: 'good' | 'joy', amt: number) => {
    const layer = coinLayerRef.current;
    if (!layer) return;
    const good = side === 'good';
    const n = amt >= 5000 ? 5 : amt >= 1000 ? 3 : amt >= 500 ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const c = document.createElement('span');
      const sz = amt >= 5000 ? 11 : amt >= 1000 ? 9 : 7;
      c.style.cssText = 'position:absolute;top:-4%;left:' + ((good ? 18.5 : 81.5) + (Math.random() * 13 - 6.5)).toFixed(1) + '%;'
        + 'width:' + sz + 'px;height:' + sz + 'px;border-radius:50%;pointer-events:none;'
        + 'background:radial-gradient(circle at 35% 30%,' + (good ? '#BFE0FF,#4A9EFF 58%,#1F5FA8' : '#FFC9BF,#FF6A5B 58%,#A32A20') + ');'
        + 'box-shadow:0 0 10px ' + (good ? 'rgba(74,158,255,.85)' : 'rgba(229,55,44,.85)') + ';'
        + 'animation:scDrop ' + (0.82 + Math.random() * 0.28).toFixed(2) + 's cubic-bezier(.42,0,.9,1) ' + (i * 0.09).toFixed(2) + 's forwards';
      layer.appendChild(c);
      setTimeout(() => { try { c.remove(); } catch { /* ignore */ } }, 1500);
    }
    const flash = document.createElement('span');
    flash.style.cssText = 'position:absolute;left:' + (good ? 18.5 : 81.5) + '%;top:76.6%;transform:translate(-50%,-50%);'
      + 'width:30%;height:14%;border-radius:50%;pointer-events:none;mix-blend-mode:screen;'
      + 'background:radial-gradient(ellipse,' + (good ? 'rgba(140,200,255,.95)' : 'rgba(255,160,140,.95)') + ',transparent 70%);'
      + 'animation:scImpact 1s ease-out .72s forwards;opacity:0';
    layer.appendChild(flash);
    setTimeout(() => { try { flash.remove(); } catch { /* ignore */ } }, 2000);
  };

  const kick = (side: 'good' | 'joy', amt: number) => {
    const P = physRef.current;
    if (!P) return;
    const mag = Math.min(2.6, 0.55 + Math.log10(Math.max(10, amt)) * 0.5);
    P.v += side === 'joy' ? mag : -mag;
    coin(side, amt);
    const glow = side === 'good' ? gGlowRef.current : jGlowRef.current;
    if (glow) { glow.style.filter = 'blur(7px) brightness(2.1)'; glow.style.opacity = '1'; }
    if (gemRef.current) gemRef.current.style.filter = 'blur(1px) brightness(2)';
    if (glowTimeoutRef.current) clearTimeout(glowTimeoutRef.current);
    glowTimeoutRef.current = setTimeout(() => {
      try {
        const d = readData(); const g = +d.good || 0, j = +d.joy || 0, tt = g + j || 1;
        if (gGlowRef.current) { gGlowRef.current.style.filter = 'blur(7px)'; gGlowRef.current.style.opacity = (0.3 + (g / tt) * 0.9).toFixed(2); }
        if (jGlowRef.current) { jGlowRef.current.style.filter = 'blur(7px)'; jGlowRef.current.style.opacity = (0.3 + (j / tt) * 0.9).toFixed(2); }
        if (gemRef.current) gemRef.current.style.filter = 'blur(1px)';
      } catch { /* ignore */ }
    }, 1400);
  };

  useEffect(() => {
    physRef.current = { a: 0, v: 0, target: 0, gDisp: null, jDisp: null, gTarget: 0, jTarget: 0, last: 0 };
    sync();
    let raf = 0;
    const step = (t: number) => {
      raf = requestAnimationFrame(step);
      const P = physRef.current;
      if (!P) return;
      const dt = Math.min(48, t - (P.last || t));
      P.last = t;
      if (!seenRef.current) return;
      const f = dt / 16.667;
      const k = 0.052, damp = 0.088;
      P.v += (P.target - P.a) * k * f;
      P.v *= Math.pow(1 - damp, f);
      P.a += P.v * f;
      const settled = Math.abs(P.v) < 0.004 && Math.abs(P.target - P.a) < 0.04;
      const jitter = settled ? Math.sin(t / 1150) * 0.16 : 0;
      const ang = P.a + jitter;
      if (tiltRef.current) tiltRef.current.style.transform = `rotate(${(ang * 0.115).toFixed(3)}deg)`;
      const drop = ang * 0.26;
      if (gGlowRef.current) gGlowRef.current.style.top = (76.6 - drop).toFixed(2) + '%';
      if (jGlowRef.current) jGlowRef.current.style.top = (76.6 + drop).toFixed(2) + '%';
      if (beamGRef.current) beamGRef.current.style.transform = `translateY(${(-drop * 0.9).toFixed(2)}px)`;
      if (beamJRef.current) beamJRef.current.style.transform = `translateY(${(drop * 0.9).toFixed(2)}px)`;
      if (gemRef.current) {
        const lt = Math.max(0, Math.min(1, (ang + 8) / 16));
        const cr = Math.round(74 + lt * 181), cg = Math.round(158 - lt * 83), cb = Math.round(255 - lt * 193);
        const gk = cr + '-' + cg + '-' + cb;
        if (P.gemKey !== gk) {
          P.gemKey = gk;
          gemRef.current.style.background = `radial-gradient(circle,rgb(${cr},${cg},${cb}),rgba(${cr},${cg},${cb},.35) 55%,transparent 72%)`;
          gemRef.current.style.boxShadow = `0 0 18px rgba(${cr},${cg},${cb},.8)`;
          if (haloRef.current) haloRef.current.style.borderColor = `rgba(${cr},${cg},${cb},.2)`;
        }
      }
      (['g', 'j'] as const).forEach((s) => {
        const key = s === 'g' ? 'gDisp' : 'jDisp';
        const tg = s === 'g' ? P.gTarget : P.jTarget;
        if (P[key] == null) P[key] = tg;
        else if (Math.abs(tg - (P[key] as number)) > 0.6) P[key] = (P[key] as number) + (tg - (P[key] as number)) * Math.min(1, 0.11 * f);
        else P[key] = tg;
        const el = s === 'g' ? gNumRef.current : jNumRef.current;
        if (el) { const txt = Math.round(P[key] as number).toLocaleString('ru-RU') + ' ₽'; if (el.textContent !== txt) el.textContent = txt; }
        const pel = s === 'g' ? gPctRef.current : jPctRef.current;
        if (pel) { const tot = (P.gDisp || 0) + (P.jDisp || 0) || 1; const v = Math.round(((P[key] as number) / tot) * 100) + '%'; if (pel.textContent !== v) pel.textContent = v; }
      });
      if (totNumRef.current) { const tot = Math.round((P.gDisp || 0) + (P.jDisp || 0)); const txt = tot.toLocaleString('ru-RU') + ' ₽ СОБРАНО'; if (totNumRef.current.textContent !== txt) totNumRef.current.textContent = txt; }
    };
    raf = requestAnimationFrame(step);
    const io = new IntersectionObserver((es) => { seenRef.current = es[0].isIntersecting; }, { threshold: 0.02 });
    if (stageRef.current) io.observe(stageRef.current);
    return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }, []);

  const give = (side: 'good' | 'joy', amt: number) => {
    const me = auth.me;
    if (!me) { openAuth({ tab: 'reg', err: 'Сначала позывной — чтобы гиря легла за тобой и пришёл доступ.' }); return; }
    const d = readData();
    d[side] = (+d[side] || 0) + amt;
    d.votes = (+d.votes || 0) + 1;
    d.feed = [{ side, who: me.nick, amt, ts: Date.now() }, ...(d.feed || [])].slice(0, 7);
    saveData(d);
    auth.credit(side, amt, false);
    sync(); kick(side, amt);
    setGen((g) => g + 1); hubBump();
    const cfg = ls<{ payUrl?: string }>('gtrpht_integrations', {});
    if (cfg.payUrl) {
      const url = cfg.payUrl.includes('{amt}') ? cfg.payUrl.split('{amt}').join(String(amt)) : cfg.payUrl;
      try { window.open(url + (url.includes('?') ? '&' : '?') + 'gtr=' + side, '_blank', 'noopener'); } catch { /* ignore */ }
    }
    notify(side === 'good'
      ? '+' + amt.toLocaleString('ru-RU') + ' ₽ в ДОБРО — чаша пошла вниз. Отчёт придёт в ТГ.'
      : '+' + amt.toLocaleString('ru-RU') + ' ₽ в СЧАСТЬЕ — ссылка на закрытый доступ уйдёт на это устройство.');
    fireWebhook('scales_donate', { side, amount: amt, who: me.nick });
  };

  const vote = (side: 'good' | 'joy') => {
    const me = auth.me;
    if (!me) { openAuth({ tab: 'reg', err: 'Голос считается только за позывным. Займёт минуту.' }); return; }
    const d = readData();
    const k = 'gtrpht_scvote_' + me.id;
    try { if (localStorage.getItem(k) === side) { notify('Твой голос уже здесь. Донат весит больше.'); return; } } catch { /* ignore */ }
    d[side] = (+d[side] || 0) + 150;
    d.votes = (+d.votes || 0) + 1;
    d.feed = [{ side, who: me.nick + ' · голос', amt: 0, ts: Date.now() }, ...(d.feed || [])].slice(0, 7);
    try { localStorage.setItem(k, side); } catch { /* ignore */ }
    saveData(d);
    auth.credit(side, 0, true);
    sync(); kick(side, 150);
    setGen((g) => g + 1); hubBump();
    notify(side === 'good' ? 'Голос за ДОБРО учтён.' : 'Голос за СЧАСТЬЕ учтён.');
    fireWebhook('scales_vote', { side, who: me.nick });
  };

  const [custom, setCustom] = useState('');
  const customGive = (side: 'good' | 'joy') => {
    const v = +(custom || 0);
    if (v < 50) { notify('Минимум 50 ₽'); return; }
    give(side, v);
    setCustom('');
  };

  const good = +data.good || 0, joy = +data.joy || 0, tot = good + joy || 1;
  const gp = good / tot, jp = joy / tot;
  const angle = Math.max(-13, Math.min(13, (jp - gp) * 26));
  const lean = Math.abs(jp - gp) < 0.04 ? 'РАВНОВЕСИЕ · СЛЕДУЮЩИЙ ХОД ЗА ТОБОЙ' : jp > gp ? 'ПЕРЕВЕС: СЧАСТЬЕ · ' + Math.round(jp * 100) + '%' : 'ПЕРЕВЕС: ДОБРО · ' + Math.round(gp * 100) + '%';
  const leanColor = Math.abs(jp - gp) < 0.04 ? '#8E8C94' : jp > gp ? '#FF6A5B' : '#4A9EFF';
  const AMOUNTS = [100, 500, 1000, 5000];
  const goodTiers = [
    tier(50000, good, 'Экстренная помощь одному человеку — билет, документы, врач'),
    tier(150000, good, 'Вывоз из страны: юрист, консульство, дорога домой'),
    tier(400000, good, 'Фонд маршрута — реагируем в тот же день, без сборов'),
  ];
  const joyTiers = [
    tierJ(50000, joy, 'Приват с балкона — 40 минут, только для донатеров'),
    tierJ(150000, joy, 'Закрытая вечеринка в прямом эфире, ссылка на 3 часа'),
    tierJ(400000, joy, 'Зарытое исполнение — треки, которые нигде не выйдут'),
  ];

  return (
    <section id="scales" data-screen-label="scales" style={{ borderTop: '1px solid #1C1C20', borderBottom: '1px solid #1C1C20', background: '#0A0A0C', marginTop: 64, padding: '56px clamp(14px,4vw,28px)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
          <h2 style={{ fontFamily: "'Inter Tight',sans-serif", fontWeight: 700, fontSize: 21, letterSpacing: '.03em', margin: 0, color: '#ECE9E4' }}>ВЕСЫ МАРШРУТА</h2>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '.2em', color: '#55545C' }}>ДОБРО ⇄ СЧАСТЬЕ · ГОЛОСУЕТ КОШЕЛЁК</div>
          <span style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #26262B', padding: '6px 12px' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#FF4B3E', animation: 'omBlink 1.4s infinite' }} />
            <span ref={totNumRef} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '.16em', color: '#B9B6BE' }}>{(good + joy).toLocaleString('ru-RU')} ₽ СОБРАНО</span>
          </div>
        </div>
        <p style={{ fontSize: 13.5, lineHeight: 1.7, color: '#A8A6AD', margin: '14px 0 0', maxWidth: 760 }}>
          Каждый донат — это гиря. Куда положишь, туда и качнётся маршрут. <strong style={{ color: '#4A9EFF', fontWeight: 600 }}>ДОБРО</strong> — ищем попавших в беду соотечественников и решаем их проблемы в дороге. <strong style={{ color: '#FF6A5B', fontWeight: 600 }}>СЧАСТЬЕ</strong> — приваты, вечеринки и зарытые исполнения в закрытом доступе. Весы живые: чаша тяжелее — эта линия идёт в эфир следующей.
        </p>

        <div ref={stageRef} className="scales-stage" style={{ position: 'relative', aspectRatio: '1131/1414', width: '100%', maxWidth: 660, margin: '26px auto 0', background: '#000', overflow: 'hidden', border: '1px solid #1E1E23' }}>
          <div ref={tiltRef} style={{ position: 'absolute', inset: 0, transform: `rotate(${(angle * 0.115).toFixed(2)}deg)`, transformOrigin: '50% 39%', willChange: 'transform' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/scales/themis.png" alt="Весы маршрута" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
          <div ref={haloRef} style={{ position: 'absolute', left: '50%', top: '22.5%', width: '46%', aspectRatio: '1', border: '1px solid rgba(229,55,44,.16)', borderRadius: '50%', animation: 'scHalo 44s linear infinite', pointerEvents: 'none', transition: 'border-color 900ms linear' }} />
          <div ref={gemRef} style={{ position: 'absolute', left: '50%', top: '39%', width: '5.4%', aspectRatio: '1', borderRadius: '50%', background: 'radial-gradient(circle,#FF6A5B,rgba(229,55,44,.35) 55%,transparent 72%)', filter: 'blur(1px)', animation: 'scGem 2.6s ease-in-out infinite', pointerEvents: 'none', transition: 'filter 600ms ease' }} />
          <div ref={gGlowRef} style={{ position: 'absolute', left: '18.5%', top: (76.6 + (gp - jp) * 3.4).toFixed(2) + '%', transform: 'translate(-50%,-50%)', width: '34%', height: '15%', borderRadius: '50%', background: 'radial-gradient(ellipse,rgba(90,170,255,.92),rgba(50,120,230,.34) 46%,transparent 74%)', filter: 'blur(7px)', opacity: (0.3 + gp * 0.9).toFixed(2), mixBlendMode: 'screen', animation: 'scBreathe 3.4s ease-in-out infinite', transition: 'opacity 900ms linear,filter 600ms ease', willChange: 'top', pointerEvents: 'none' }} />
          <div ref={jGlowRef} style={{ position: 'absolute', left: '81.5%', top: (76.6 + (jp - gp) * 3.4).toFixed(2) + '%', transform: 'translate(-50%,-50%)', width: '34%', height: '15%', borderRadius: '50%', background: 'radial-gradient(ellipse,rgba(255,110,90,.92),rgba(229,55,44,.34) 46%,transparent 74%)', filter: 'blur(7px)', opacity: (0.3 + jp * 0.9).toFixed(2), mixBlendMode: 'screen', animation: 'scBreathe 3.4s ease-in-out .7s infinite', transition: 'opacity 900ms linear,filter 600ms ease', willChange: 'top', pointerEvents: 'none' }} />
          <div ref={coinLayerRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 3 }} />
          <div style={{ position: 'absolute', left: '6%', right: '64%', top: '60%', height: '22%', overflow: 'hidden', pointerEvents: 'none', opacity: (0.3 + gp * 0.9).toFixed(2), transition: 'opacity 900ms linear' }}>
            {SPARKS.map((sp, i) => <span key={i} style={{ position: 'absolute', bottom: 0, left: sp.x, width: 2, height: 2, borderRadius: '50%', background: '#8FC4FF', boxShadow: '0 0 6px #4A9EFF', animation: `scSpark ${sp.dur} linear ${sp.delay} infinite` }} />)}
          </div>
          <div style={{ position: 'absolute', left: '64%', right: '6%', top: '60%', height: '22%', overflow: 'hidden', pointerEvents: 'none', opacity: (0.3 + jp * 0.9).toFixed(2), transition: 'opacity 900ms linear' }}>
            {SPARKS.map((sp, i) => <span key={i} style={{ position: 'absolute', bottom: 0, left: sp.x, width: 2, height: 2, borderRadius: '50%', background: '#FF9A8C', boxShadow: '0 0 6px #E5372C', animation: `scSpark ${sp.dur} linear ${sp.delay} infinite` }} />)}
          </div>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 2, background: 'linear-gradient(90deg,transparent,rgba(229,55,44,.5),transparent)', animation: 'scScan 9s linear infinite', pointerEvents: 'none' }} />
          <div ref={beamGRef} style={{ position: 'absolute', left: '3%', top: '82.5%', width: '31%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, pointerEvents: 'none', willChange: 'transform' }}>
            <div ref={gPctRef} style={{ fontFamily: "'Inter Tight',sans-serif", fontWeight: 900, fontSize: 'clamp(16px,3vw,26px)', color: '#8FC4FF', textShadow: '0 0 18px rgba(74,158,255,.6)', lineHeight: 1 }}>{Math.round(gp * 100)}%</div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 'clamp(7px,1.1vw,9.5px)', letterSpacing: '.24em', color: '#4A9EFF' }}>ДОБРО</div>
            <div ref={gNumRef} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 'clamp(7px,1.1vw,10px)', letterSpacing: '.04em', color: '#ECE9E4' }}>{good.toLocaleString('ru-RU')} ₽</div>
          </div>
          <div ref={beamJRef} style={{ position: 'absolute', right: '3%', top: '82.5%', width: '31%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, pointerEvents: 'none', willChange: 'transform' }}>
            <div ref={jPctRef} style={{ fontFamily: "'Inter Tight',sans-serif", fontWeight: 900, fontSize: 'clamp(16px,3vw,26px)', color: '#FF8A7C', textShadow: '0 0 18px rgba(229,55,44,.6)', lineHeight: 1 }}>{Math.round(jp * 100)}%</div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 'clamp(7px,1.1vw,9.5px)', letterSpacing: '.24em', color: '#FF6A5B' }}>СЧАСТЬЕ</div>
            <div ref={jNumRef} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 'clamp(7px,1.1vw,10px)', letterSpacing: '.04em', color: '#ECE9E4' }}>{joy.toLocaleString('ru-RU')} ₽</div>
          </div>
          <div style={{ position: 'absolute', left: '50%', top: '4.5%', transform: 'translateX(-50%)', fontFamily: "'JetBrains Mono',monospace", fontSize: 'clamp(7.5px,1.2vw,10px)', letterSpacing: '.24em', color: leanColor, whiteSpace: 'nowrap', textAlign: 'center', pointerEvents: 'none' }}>{lean}</div>
          {(['tl', 'tr', 'bl', 'br'] as const).map((c) => (
            <div key={c} style={{ position: 'absolute', width: 16, height: 16, pointerEvents: 'none', top: c[0] === 't' ? 6 : undefined, bottom: c[0] === 'b' ? 6 : undefined, left: c[1] === 'l' ? 6 : undefined, right: c[1] === 'r' ? 6 : undefined, borderTop: c[0] === 't' ? '1px solid rgba(229,55,44,.55)' : undefined, borderBottom: c[0] === 'b' ? '1px solid rgba(229,55,44,.55)' : undefined, borderLeft: c[1] === 'l' ? '1px solid rgba(229,55,44,.55)' : undefined, borderRight: c[1] === 'r' ? '1px solid rgba(229,55,44,.55)' : undefined }} />
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(320px,100%),1fr))', gap: 14, marginTop: 18 }}>
          <SidePanel title="ДОБРО" subtitle="ПОМОЩЬ НА МАРШРУТЕ" subCol="#2E5C8E" titleCol="#8FC4FF" border={gp > jp ? '#2A4E80' : '#26262B'} cornerCol="#4A9EFF"
            desc="Ищем соотечественников и не только — тех, кто попал в беду в Тайланде. Потеряны документы, нет денег на обратный билет, застряли в больнице, кинул работодатель. Экипаж выезжает, снимает, решает. Каждый рубль — в открытом отчёте."
            tiers={goodTiers} barCol="#4A9EFF" amounts={AMOUNTS} onGive={(a) => give('good', a)} onVote={() => vote('good')} btnBorder="#2A4E80" btnCol="#8FC4FF" />
          <SidePanel title="СЧАСТЬЕ" subtitle="ЗАКРЫТЫЙ ДОСТУП" subCol="#8E332B" titleCol="#FF8A7C" border={jp > gp ? '#6E2A24' : '#26262B'} cornerCol="#E5372C" cornerPos="tr"
            desc="Разъёб. Вечеринки, приваты, зарытые исполнения — треки, которые нигде не выйдут. Трансляции только для тех, кто внутри. Ссылка живёт 3 часа, записи нет. То, что не для всех."
            tiers={joyTiers} barCol="#E5372C" amounts={AMOUNTS} onGive={(a) => give('joy', a)} onVote={() => vote('joy')} btnBorder="#6E2A24" btnCol="#FF8A7C" />
        </div>

        <div style={{ border: '1px solid #26262B', background: '#0D0D0F', padding: 18, marginTop: 14 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'stretch', marginBottom: 16 }}>
            <input value={custom} onChange={(e) => setCustom(e.target.value.replace(/[^\d]/g, ''))} placeholder="СВОЯ СУММА ₽" inputMode="numeric" style={{ flex: 1, minWidth: 130, background: '#141416', border: '1px solid #2A2A30', color: '#ECE9E4', fontFamily: "'Inter Tight',sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: '.06em', padding: '12px 14px', outline: 'none', textAlign: 'center' }} />
            <button onClick={() => customGive('good')} style={{ background: 'none', border: '1px solid #2A4E80', color: '#8FC4FF', fontFamily: "'Inter Tight',sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: '.1em', padding: '12px 20px', cursor: 'pointer', minHeight: 44 }}>→ ДОБРО</button>
            <button onClick={() => customGive('joy')} style={{ background: 'none', border: '1px solid #6E2A24', color: '#FF8A7C', fontFamily: "'Inter Tight',sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: '.1em', padding: '12px 20px', cursor: 'pointer', minHeight: 44 }}>→ СЧАСТЬЕ</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '.22em', color: '#8E8C94' }}>{'// ЛЕНТА ГИРЬ'}</div>
            <span style={{ flex: 1 }} />
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '.14em', color: '#55545C' }}>{(+data.votes || 0).toLocaleString('ru-RU')} ГОЛОСОВ · ОБНОВЛЯЕТСЯ ЖИВЬЁМ</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14 }}>
            {(data.feed || []).map((f, i) => {
              const col = f.side === 'good' ? '#4A9EFF' : '#FF6A5B';
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, borderLeft: `2px solid ${col}`, background: '#101013', padding: '9px 12px', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '.1em', color: col }}>{f.side === 'good' ? 'ДОБРО' : 'СЧАСТЬЕ'}</span>
                  <span style={{ fontSize: 12.5, color: '#ECE9E4', fontWeight: 500 }}>{f.who}</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: col }}>{f.amt ? '+' + f.amt.toLocaleString('ru-RU') + ' ₽' : 'голос'}</span>
                  <span style={{ flex: 1, minWidth: 20 }} />
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: '#4A4950' }}>{ago(f.ts)}</span>
                </div>
              );
            })}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, letterSpacing: '.06em', lineHeight: 1.7, color: '#4A4950', marginTop: 14 }}>
            Отчёт по ДОБРУ публикуется в Телеграме после каждого закрытого кейса — с чеками и видео. Доступ к СЧАСТЬЮ приходит ссылкой на устройство, с которого пришёл донат.
          </div>
        </div>
      </div>
    </section>
  );
}

interface TierView { sum: string; label: string; pct: string; state: string; brd: string; bg: string; sumCol: string; txtCol: string; stCol: string }

function SidePanel({ title, subtitle, subCol, titleCol, border, cornerCol, cornerPos = 'tl', desc, tiers, barCol, amounts, onGive, onVote, btnBorder, btnCol }: {
  title: string; subtitle: string; subCol: string; titleCol: string; border: string; cornerCol: string; cornerPos?: 'tl' | 'tr';
  desc: string; tiers: TierView[]; barCol: string; amounts: number[]; onGive: (a: number) => void; onVote: () => void; btnBorder: string; btnCol: string;
}) {
  return (
    <div style={{ border: `1px solid ${border}`, background: '#0D0D0F', padding: 20, position: 'relative' }}>
      {cornerPos === 'tl'
        ? <div style={{ position: 'absolute', top: -1, left: -1, width: 14, height: 14, borderTop: `2px solid ${cornerCol}`, borderLeft: `2px solid ${cornerCol}` }} />
        : <div style={{ position: 'absolute', top: -1, right: -1, width: 14, height: 14, borderTop: `2px solid ${cornerCol}`, borderRight: `2px solid ${cornerCol}` }} />}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ fontFamily: "'Inter Tight',sans-serif", fontWeight: 900, fontSize: 17, letterSpacing: '.04em', color: titleCol }}>{title}</div>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '.18em', color: subCol }}>{subtitle}</div>
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.7, color: '#A8A6AD', marginTop: 10 }}>{desc}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
        {tiers.map((tr, i) => (
          <div key={i} style={{ border: `1px solid ${tr.brd}`, background: tr.bg, padding: '10px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '.1em', color: tr.sumCol }}>{tr.sum}</span>
              <span style={{ fontSize: 12, color: tr.txtCol, flex: 1, minWidth: 140 }}>{tr.label}</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '.14em', color: tr.stCol }}>{tr.state}</span>
            </div>
            <div style={{ height: 3, background: '#1A1A1E', marginTop: 8 }}><div style={{ height: 3, background: barCol, width: tr.pct }} /></div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 16 }}>
        {amounts.map((a) => (
          <button key={a} onClick={() => onGive(a)} style={{ flex: 1, minWidth: 72, background: 'none', border: `1px solid ${btnBorder}`, color: btnCol, fontFamily: "'JetBrains Mono',monospace", fontSize: 11, letterSpacing: '.06em', padding: '12px 6px', cursor: 'pointer', minHeight: 44 }}>{a >= 1000 ? a / 1000 + 'K ₽' : a + ' ₽'}</button>
        ))}
      </div>
      <button onClick={onVote} style={{ width: '100%', marginTop: 8, background: 'none', border: `1px dashed ${btnBorder}`, color: btnCol, fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, letterSpacing: '.14em', padding: 11, cursor: 'pointer', minHeight: 44 }}>ГОЛОС БЕЗ ДОНАТА · +1</button>
    </div>
  );
}
