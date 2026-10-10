'use client';
import { useEffect, useRef, useState } from 'react';

/**
 * The hero's one action: a camera REC button. Tap = START — the soundtrack comes on and the reel locks
 * to its beat; the dome stays pressed, the dot blinks and the track timecode runs. Tap again to stop.
 * Uses the shared <audio> (window.__gtrAudio) of the dock player, so both stay in sync.
 */
export function RecStart({ ru }: { ru: boolean }) {
  const [on, setOn] = useState(false);
  const tc = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const a = window.__gtrAudio;
      const playing = !!a && !a.paused;
      setOn((v) => (v === playing ? v : playing));
      if (playing && tc.current) {
        const s = a!.currentTime;
        tc.current.textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s) % 60).padStart(2, '0')}:${String(Math.floor((s % 1) * 24)).padStart(2, '0')}`;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const press = () => {
    const a = window.__gtrAudio;
    if (!a) return;
    if (a.paused) a.play().catch(() => {}); else a.pause();
  };

  return (
    <button type="button" className={'rec-start' + (on ? ' on' : '')} onClick={press} data-audio-ui
      aria-pressed={on} aria-label={on ? (ru ? 'Стоп — выключить саундтрек' : 'Stop — soundtrack off') : (ru ? 'Старт — включить саундтрек' : 'Start — soundtrack on')}>
      <span className="rs-bezel" aria-hidden><span className="rs-dome" /></span>
      <span className="rs-text">
        <b>{on ? 'REC' : 'START'}</b>
        {/* the timecode node is written directly every frame, so React never owns its text */}
        <span className="rs-sub rs-tc" ref={tc} hidden={!on} />
        <span className="rs-sub" hidden={on}>{ru ? 'со звуком' : 'with sound'}</span>
      </span>
    </button>
  );
}
