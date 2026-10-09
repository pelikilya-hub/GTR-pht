'use client';
import { useHub } from '@/lib/HubContext';
import { GtrDeity } from './GtrDeity';
import { CornerBrackets } from './CornerBrackets';

function CountdownDigit({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 'clamp(36px,10vw,52px)' }}>
      <div className="countdown-digit" style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, fontSize: 'clamp(28px,8vw,42px)', color: '#FF2A1A', textShadow: '0 0 18px rgba(255,42,26,.6),0 0 40px rgba(255,42,26,.25)', letterSpacing: '.04em', lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, letterSpacing: '.3em', color: '#55545C', marginTop: 5 }}>{label}</div>
    </div>
  );
}
function Colon() {
  return <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 'clamp(22px,6vw,32px)', color: '#FF2A1A', textShadow: '0 0 12px rgba(255,42,26,.5)', opacity: 0.7, paddingBottom: 16, animation: 'omBlink 1.1s infinite' }}>:</div>;
}

export function Hero() {
  const { t, lang, journey, scrollToId } = useHub();
  const { isCountdown, isJourney, cd, day, km, curStage, ictTime } = journey;
  const cdTitle = isCountdown ? t.cdTitle : journey.isDone ? t.doneTitle : t.liveTitle;

  return (
    <section data-screen-label="hero" style={{ maxWidth: 1280, margin: '0 auto', padding: '60px clamp(14px,4vw,28px) 40px', display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'stretch', position: 'relative', overflow: 'hidden' }}>
      <div className="hero-thai-overlay" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '44%', minWidth: 280, pointerEvents: 'none', opacity: 0.85, maskImage: 'linear-gradient(90deg,transparent,#000 22%)', zIndex: 0 }}>
        <GtrDeity variant="thailand" />
        <div style={{ position: 'absolute', right: 6, bottom: 2, fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '.28em', color: '#3E3E46' }}>FORM 00 · TH-GRID · ROUTE + EVENTS</div>
      </div>

      <div className="hero-copy" style={{ flex: '1 1 540px', minWidth: 320, position: 'relative', zIndex: 1 }}>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, letterSpacing: '.34em', color: '#E5372C' }}>{t.tagline}</div>
        <h1 className="hero-h1" style={{ fontFamily: "'Inter Tight',sans-serif", fontWeight: 900, fontSize: 'clamp(32px,4.4vw,56px)', lineHeight: 1.06, margin: '18px 0 0', color: '#ECE9E4' }}>
          {t.heroA}<br /><span style={{ color: '#E5372C' }}>{t.heroB}</span>
        </h1>
        <p style={{ maxWidth: 560, fontSize: 16.5, lineHeight: 1.68, color: '#A8A6AD', margin: '22px 0 0' }}>{t.heroSub}</p>
        <div className="hero-cta-row" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 30 }}>
          <button onClick={() => scrollToId('stream')} style={{ background: '#E5372C', border: '1px solid #E5372C', color: '#0B0B0C', fontFamily: "'Inter Tight',sans-serif", fontWeight: 700, fontSize: 12.5, letterSpacing: '.08em', padding: '16px 26px', cursor: 'pointer' }}>{t.ctaWatch}</button>
          <button onClick={() => scrollToId('tiers')} style={{ background: 'none', border: '1px solid #2E2E34', color: '#ECE9E4', fontFamily: "'Inter Tight',sans-serif", fontWeight: 700, fontSize: 12.5, letterSpacing: '.08em', padding: '16px 26px', cursor: 'pointer' }}>{t.ctaJoin}</button>
          <button onClick={() => scrollToId('scales')} style={{ background: 'none', border: '1px solid #2A4E80', color: '#8FC4FF', fontFamily: "'Inter Tight',sans-serif", fontWeight: 700, fontSize: 12.5, letterSpacing: '.08em', padding: '16px 26px', cursor: 'pointer' }}>ВЕСЫ ⇄</button>
        </div>
        <div className="hero-stats" style={{ display: 'flex', gap: 36, flexWrap: 'wrap', marginTop: 42 }}>
          {[{ v: '39', c: t.sDays }, { v: '2 830', c: t.sKm }, { v: '7', c: t.sBases }, { v: '19', c: t.sSpots }].map((s) => (
            <div key={s.c}>
              <div style={{ fontFamily: "'Inter Tight',sans-serif", fontWeight: 700, fontSize: 24, color: '#ECE9E4' }}>{s.v}</div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '.12em', color: '#6E6C74', marginTop: 6 }}>{s.c}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="hero-card" style={{ flex: '0 1 380px', minWidth: 300, border: '1px solid #26262B', background: '#111114', padding: 26, position: 'relative' }}>
        <CornerBrackets positions={['tl', 'br']} />
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, letterSpacing: '.22em', color: '#8E8C94' }}>{cdTitle}</div>
        {isCountdown ? (
          <div style={{ marginTop: 18, background: '#080808', border: '1px solid #1A1A1E', padding: '16px 12px 12px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg,transparent 0px,transparent 1px,rgba(255,60,50,.015) 1px,rgba(255,60,50,.015) 2px)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(180deg,rgba(255,70,60,.04),transparent)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, position: 'relative' }}>
              <CountdownDigit value={cd.d} label={t.cdD} /><Colon />
              <CountdownDigit value={cd.h} label={t.cdH} /><Colon />
              <CountdownDigit value={cd.m} label={t.cdM} /><Colon />
              <CountdownDigit value={cd.s} label={t.cdS} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, position: 'relative' }}>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, letterSpacing: '.2em', color: '#3E3E46' }}>REC ● {ictTime}</div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, letterSpacing: '.2em', color: '#3E3E46' }}>01.08.2026</div>
            </div>
          </div>
        ) : null}
        {isJourney ? (
          <>
            <div style={{ marginTop: 20, display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, letterSpacing: '.2em', color: '#8E8C94' }}>{t.dayWord}</span>
              <span style={{ fontFamily: "'Inter Tight',sans-serif", fontWeight: 900, fontSize: 52, color: '#FF4B3E', lineHeight: 1 }}>{day}</span>
              <span style={{ fontFamily: "'Inter Tight',sans-serif", fontWeight: 700, fontSize: 20, color: '#55545C' }}>/39</span>
            </div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, letterSpacing: '.08em', color: '#A8A6AD', marginTop: 12 }}>
              {km.toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US')} / 2 830 {t.kmUnit} · {curStage}
            </div>
          </>
        ) : null}
        <div style={{ borderTop: '1px solid #1E1E23', marginTop: 24, paddingTop: 14, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '.12em', color: '#55545C' }}>{t.startLabel}</div>
      </div>
    </section>
  );
}
