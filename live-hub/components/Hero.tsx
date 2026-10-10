'use client';
import { useHub } from '@/lib/HubContext';
import { HeroReel } from './fx/HeroReel';
import { Count } from './ui/Motion';
import { CodeText } from './fx/CodeText';

export function Hero() {
  const { t, lang, journey, scrollToId } = useHub();
  const ru = lang === 'ru';
  const loc = ru ? 'ru-RU' : 'en-US';
  const { phase, cd } = journey;

  const ticker = [
    <>{journey.startLabel}</>,
    <>{ru ? 'ФИНИШ' : 'FINISH'} · <b>15.11.2026</b> · {ru ? 'ПХУКЕТ' : 'PHUKET'}</>,
    <>{ru ? 'ПОЗИЦИЯ' : 'POSITION'} · <b>{journey.posLabel}</b></>,
    <>{ru ? 'СЛЕД. ТОЧКА' : 'NEXT'} · <b>{journey.nextPoint}</b></>,
    <>{ru ? 'СТАТУС' : 'STATUS'} · <b>{journey.crewStatus}</b></>,
    <>ICT · <b>{journey.ictTime}</b></>,
    <>{ru ? 'ПРОЙДЕНО' : 'COVERED'} · <b>{journey.km.toLocaleString(loc)} / {journey.totalKm.toLocaleString(loc)} {t.kmUnit}</b></>,
  ];

  return (
    <section className="hero" id="top" data-screen-label="hero">
      <HeroReel />
      <div className="laser" aria-hidden />
      <div className="wrap" style={{ position: 'relative', width: '100%' }}>
        <div className="hero-grid">
          <div>
            <div className="rv" style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="kicker">{t.tagline}</span>
              <span className="tag">🎬 {ru ? 'Первая съёмка · Bangla Road, Патонг' : 'First shoot · Bangla Road, Patong'}</span>
            </div>
            <h1 aria-label={t.heroA + ' ' + t.heroB}>
              <CodeText text={t.heroA} speed={0.8} /><br />
              <CodeText text={t.heroB} speed={0.8} alt={false} accent="none" className="red-line" />
            </h1>
            <p className="lead rv" style={{ ['--d' as string]: '.25s' }}>{t.heroSub}</p>
            <div className="hero-cta rv" style={{ ['--d' as string]: '.35s' }}>
              <button className="btn btn-red" onClick={() => scrollToId('live')}>
                <span className={'dot' + (phase === 'live' ? ' live' : '')} style={{ background: '#fff' }} />
                {t.ctaWatch}
              </button>
              <button className="btn" onClick={() => scrollToId('route')}>{ru ? 'Смотреть маршрут' : 'See the route'}</button>
              <button className="btn" onClick={() => scrollToId('cars')}>{ru ? 'Охота за тачками' : 'Car hunt'}</button>
            </div>
          </div>

          <div className="glass hero-status rv" style={{ ['--d' as string]: '.3s' }}>
            <div className="meta" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className={'dot' + (phase === 'live' ? ' live' : '')} />
              {phase === 'live' ? t.liveTitle : phase === 'done' ? t.doneTitle : phase === 'countdown' ? t.cdTitle : (ru ? 'СТАРТ ПРОТОКОЛА' : 'PROTOCOL START')}
            </div>
            {phase === 'soon' && (
              <div style={{ marginTop: 16 }}>
                <div className="big">{t.soonBig}</div>
                <p style={{ color: 'var(--ink-2)', fontSize: 14.5, lineHeight: 1.6, margin: '14px 0 0' }}>
                  {ru ? 'Дату старта объявим в эфире. Финиш — 15 ноября на Пхукете.' : 'Start date drops on stream. Finish — 15 November on Phuket.'}
                </p>
              </div>
            )}
            {phase === 'countdown' && (
              <div className="cd">
                {[[cd.d, t.cdD], [cd.h, t.cdH], [cd.m, t.cdM], [cd.s, t.cdS]].map(([v, l]) => (
                  <div key={l}><b>{v}</b><span>{l}</span></div>
                ))}
              </div>
            )}
            {(phase === 'live' || phase === 'done') && (
              <div style={{ marginTop: 16 }}>
                <div className="big">{journey.day}<small>{t.dayOf} {journey.totalDays}</small></div>
                <div className="bar" style={{ marginTop: 18 }}><i style={{ width: journey.routePct + '%' }} /></div>
                <div className="meta" style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <span>{journey.curStage}</span><span>{journey.routePct}%</span>
                </div>
              </div>
            )}
            <div className="hair" style={{ marginTop: 20, paddingTop: 14 }}>
              <div className="meta">{journey.datesLabel}</div>
            </div>
          </div>
        </div>

        <div className="stats">
          {[
            { v: journey.totalDays || 30, pre: journey.totalDays ? '' : '≈', c: t.sDays },
            { v: journey.totalKm, pre: '', c: t.sKm },
            { v: journey.stopsCount, pre: '', c: t.sBases },
            { v: 19, pre: '', c: t.sSpots },
          ].map((s, i) => (
            <div key={s.c} className="rv" style={{ ['--d' as string]: `${0.05 * i}s` }}>
              <b>{s.pre}<Count to={s.v} locale={loc} /></b>
              <span>{s.c}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="ticker" style={{ marginTop: 'clamp(36px,5vw,64px)' }} aria-hidden>
        <div className="ticker-track">
          {[...ticker, ...ticker].map((x, i) => <span key={i}>{x}</span>)}
        </div>
      </div>
    </section>
  );
}
