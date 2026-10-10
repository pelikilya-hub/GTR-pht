'use client';
import { useEffect, useMemo, useState } from 'react';
import { useHub } from '@/lib/HubContext';
import { ls } from '@/lib/storage';
import { campaign, type PromoLine } from '@/lib/promo';
import { CodeText } from './CodeText';

/**
 * The hero headline as film-style title cards: brand line → cast (ILIA | GTR) → crew teasers → countdown →
 * the warm-up of the current campaign stage. Cards switch on bar boundaries of the playing track
 * (every 2 bars, 4 above 120 BPM), or every 5.5 s without sound; each new card decodes out of glyph noise.
 */
export function HeroTitles() {
  const { t, lang, journey, now } = useHub();
  const ru = lang === 'ru';
  const custom = ls<PromoLine[]>('gtrpht_promo', []);
  // re-plan once a minute is plenty (`now` ticks every second)
  const minute = Math.floor(now / 60000);
  const customKey = JSON.stringify(custom);
  const cards = useMemo(
    () => campaign(journey, minute * 60000, ru, t.heroA, t.heroB, JSON.parse(customKey) as PromoLine[]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ru, t.heroA, t.heroB, journey.phase, journey.day, journey.curStage, minute, customKey],
  );
  const [i, setI] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0, own = 0, last = performance.now();
    const tick = (ts: number) => {
      raf = requestAnimationFrame(tick);
      const dt = (ts - last) / 1000; last = ts;
      const a = window.__gtrAudio, g = window.__gtrGrid;
      let slot: number;
      if (a && g && !a.paused) {
        const per = g.bpm > 120 ? 16 : 8; // beats per card
        slot = Math.floor(Math.max(0, (a.currentTime - g.offset) * g.bpm / 60) / per);
      } else { own += Math.min(dt, 0.1); slot = Math.floor(own / 5.5); }
      const n = slot % cards.length;
      setI((cur) => (cur === n ? cur : n));
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cards.length]);

  const c = cards[Math.min(i, cards.length - 1)];
  const cast = c.a.includes('|');
  return (
    <div className="hero-titles" aria-live="off">
      <div className="ht-k meta" key={'k' + i}>{c.k}<span className="ht-n">{String(i + 1).padStart(2, '0')}/{String(cards.length).padStart(2, '0')}</span></div>
      <h1 aria-label={cards[0].a + ' ' + (cards[0].b || '')} className={cast ? 'ht-cast' : ''}>
        <CodeText text={c.a} speed={1.1} alt={cast} accent={cast ? undefined : 'none'} /><br />
        {c.b ? <CodeText text={c.b} speed={1.1} alt={false} accent="none" className="red-line" /> : <span className="red-line">&nbsp;</span>}
      </h1>
    </div>
  );
}
