'use client';
import Link from 'next/link';
import { useHub } from '@/lib/HubContext';

export function Topbar() {
  const { t, lang, setLang, journey, auth, openAuth, notify } = useHub();
  const { isJourney, isDone, isCountdown, cd, day } = journey;
  const ru = lang === 'ru';
  const topStatus = isJourney && !isDone ? t.statusLive : isCountdown ? t.statusSoon : t.statusDone;
  const topCounter = isCountdown ? 'T-' + cd.d : (ru ? 'ДЕНЬ ' : 'DAY ') + day + '/39';
  const dotColor = isJourney && !isDone ? '#FF4B3E' : '#8E8C94';
  const dotAnim = isJourney && !isDone ? 'omBlink 1.1s infinite' : 'none';
  const me = auth.me;
  const roleCol: Record<string, string> = { sub: '#8E8C94', donor: '#4A9EFF', crew: '#FF6A5B' };

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 1100, backdropFilter: 'blur(12px)', background: 'rgba(11,11,12,.86)', borderBottom: '1px solid #1C1C20' }} className="sticky-topbar">
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(12px,3vw,28px)', minHeight: 58, display: 'flex', alignItems: 'center', gap: 'clamp(6px,1.5vw,18px)', flexWrap: 'wrap' }}>
        <div style={{ fontFamily: "'Unbounded',sans-serif", fontWeight: 900, fontSize: 16, letterSpacing: '.05em' }}>GTR<span style={{ color: '#E5372C' }}>|</span>PHT</div>
        <div className="hdr-ver" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, letterSpacing: '.14em', color: '#55545C' }}>PROTOCOL v26.08</div>
        <div style={{ flex: 1 }} />
        <Link href="/pult" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '.14em', color: '#FF6A5B' }}>{t.consoleLink}</Link>
        <a href="#" onClick={(e) => { e.preventDefault(); notify(ru ? 'Промо — отдельный дизайн-файл, не входит в эту сборку' : 'Promo is a separate design file, not part of this build'); }} className="nav-link-promo" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '.14em', color: '#FF6A5B' }}>ПРОМО ▶</a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #2A2A30', padding: '6px 12px' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor, animation: dotAnim }} />
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '.16em', color: '#B9B6BE' }}>{topStatus}</span>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '.1em', color: '#E5372C' }}>{topCounter}</span>
        </div>
        <button onClick={() => openAuth()} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: `1px solid ${me ? (roleCol[me.role] || '#2A2A30') : '#2A2A30'}`, padding: '6px 12px', cursor: 'pointer', minHeight: 36 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: me ? (roleCol[me.role] || '#55545C') : '#55545C' }} />
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '.14em', color: me ? '#ECE9E4' : '#B9B6BE' }}>{me ? me.nick.toUpperCase().slice(0, 12) : 'ВОЙТИ'}</span>
        </button>
        <div className="lang-switch" style={{ display: 'flex', gap: 2 }}>
          <button onClick={() => setLang('ru')} style={{ background: 'none', border: `1px solid ${ru ? '#E5372C' : '#2A2A30'}`, color: ru ? '#FF6A5B' : '#6E6C74', fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '.1em', padding: '6px 10px', cursor: 'pointer' }}>RU</button>
          <button onClick={() => setLang('en')} style={{ background: 'none', border: `1px solid ${!ru ? '#E5372C' : '#2A2A30'}`, color: !ru ? '#FF6A5B' : '#6E6C74', fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '.1em', padding: '6px 10px', cursor: 'pointer' }}>EN</button>
        </div>
      </div>
    </div>
  );
}
