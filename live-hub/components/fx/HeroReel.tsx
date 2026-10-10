'use client';
import { useEffect, useRef, useState } from 'react';
import { sfx } from '@/lib/sfx';

type Shot = { kind: 'video' | 'image'; src: string; from?: number; beats: number; label: string; pos?: string };

/**
 * Trailer cut: real footage of the Bangtaostyle pickup + Bangla Road, glitch cuts, camera HUD.
 * Cuts land on the beat grid of whatever playlist track is playing (lib/beatmap.ts): the reel is then
 * clocked by audio.currentTime; without sound it runs its own clock at the soundtrack's 88 BPM.
 * Shot lengths are in "units": one beat for slow tracks, two beats above 120 BPM, so a 142 BPM track
 * doesn't turn the edit into a strobe. 24 units per loop.
 */
const SHOTS: Shot[] = [
  { kind: 'video', src: '/assets/video/car-2.mp4', from: 0.2, beats: 4, label: 'NIGHT DRIFT · BANGTAO STYLE' },
  { kind: 'video', src: '/assets/video/car-1.mp4', from: 5.6, beats: 2, label: 'WHEELS · BTS ORANGE' },
  { kind: 'image', src: '/assets/crew/ilia-bangla.jpg', beats: 4, label: 'BANGLA ROAD · PATONG', pos: '50% 22%' },
  { kind: 'video', src: '/assets/video/car-3.mp4', from: 0.6, beats: 4, label: 'COAST RUN · ANDAMAN' },
  { kind: 'video', src: '/assets/video/night-teaser.mp4', from: 2.0, beats: 4, label: 'POV · NIGHT SHIFT' },
  { kind: 'video', src: '/assets/video/car-2.mp4', from: 6.0, beats: 2, label: 'SMOKE · MOONLIGHT' },
  { kind: 'video', src: '/assets/video/car-1.mp4', from: 9.0, beats: 4, label: 'HOOD · BANGTAOSTYLE.COM' },
];
const LOOP = SHOTS.reduce((s, x) => s + x.beats, 0);
const STARTS = SHOTS.map((_, i) => SHOTS.slice(0, i).reduce((s, x) => s + x.beats, 0));
const FREE_BPM = 88;

const pad = (n: number, l = 2) => String(n).padStart(l, '0');
const shotAt = (b: number) => { let i = SHOTS.length - 1; while (i > 0 && STARTS[i] > b) i--; return i; };

export function HeroReel() {
  const [idx, setIdx] = useState(0);
  const [cut, setCut] = useState(false);
  const [still, setStill] = useState(false);
  const [bpm, setBpm] = useState(0); // >0 while the reel is clocked by a playing track
  const sync = bpm > 0;
  const vids = useRef<(HTMLVideoElement | null)[]>([]);
  const box = useRef<HTMLDivElement | null>(null);
  const live = useRef(true);
  const idxRef = useRef(0);
  const tcRef = useRef<HTMLSpanElement | null>(null);

  // reduced motion → one graded still, no cutting
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const r = requestAnimationFrame(() => setStill(true));
      return () => cancelAnimationFrame(r);
    }
  }, []);

  // start the clip of the current shot from its in-point
  useEffect(() => {
    if (still) return;
    const shot = SHOTS[idx];
    const v = vids.current[idx];
    if (shot.kind === 'video' && v) {
      try { v.currentTime = shot.from || 0; } catch { /* not loaded yet */ }
      if (live.current) v.play().catch(() => {});
    }
    vids.current.forEach((o, i) => { if (o && i !== idx) o.pause(); });
  }, [idx, still]);

  // master clock: soundtrack time when it plays, own clock otherwise → beat → shot, kick, timecode
  useEffect(() => {
    if (still) return;
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      live.current = e.isIntersecting && document.visibilityState === 'visible';
      const v = vids.current[idxRef.current];
      if (v) { if (live.current) v.play().catch(() => {}); else v.pause(); }
    }, { threshold: 0.05 });
    io.observe(el);
    const host = (el.closest('section') as HTMLElement | null) || el;

    let raf = 0, last = performance.now(), own = 0, lastTc = 0, wasBpm = 0, cutT = 0, lastKick = '', lastSp = '';
    // phones: 2-digit steps so the whole hero isn't restyled on every frame
    const coarse = window.matchMedia('(hover: none), (max-width: 760px)').matches;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      if (!live.current) return;
      const a = window.__gtrAudio, g = window.__gtrGrid;
      const synced = !!(a && g && !a.paused && a.readyState >= 2);
      const nb = synced ? g!.bpm : 0;
      if (nb !== wasBpm) { wasBpm = nb; setBpm(nb); }
      let clock: number, beat: number;
      if (synced) { clock = a!.currentTime; beat = (clock - g!.offset) * g!.bpm / 60 / (g!.bpm > 120 ? 2 : 1); }
      else { own += dt; clock = own; beat = own * FREE_BPM / 60; }

      const lb = ((Math.floor(Math.max(0, beat)) % LOOP) + LOOP) % LOOP;
      const i = shotAt(lb);
      const frac = beat - Math.floor(beat);
      // kick envelope on every beat (stronger on the bar's downbeat) + shot progress for the HUD
      const down = Math.floor(Math.max(0, beat)) % 4 === 0;
      const kick = beat < 0 ? 0 : Math.pow(1 - frac, 3) * (down ? 1 : 0.55);
      const ks = kick.toFixed(coarse ? 1 : 2), sp = Math.min(1, (lb - STARTS[i] + frac) / SHOTS[i].beats).toFixed(coarse ? 2 : 3);
      if (ks !== lastKick) { lastKick = ks; host.style.setProperty('--kick', ks); }
      if (sp !== lastSp) { lastSp = sp; el.style.setProperty('--sp', sp); }

      if (i !== idxRef.current) {
        idxRef.current = i;
        setIdx(i);
        setCut(true);
        clearTimeout(cutT);
        cutT = window.setTimeout(() => setCut(false), 240);
        if (!synced) sfx('open');
      }
      if (now - lastTc > 42 && tcRef.current) {
        lastTc = now;
        tcRef.current.textContent = (`${pad(Math.floor(clock / 3600))}:${pad(Math.floor(clock / 60) % 60)}:${pad(Math.floor(clock) % 60)}:${pad(Math.floor((clock % 1) * 24))}`);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => { io.disconnect(); cancelAnimationFrame(raf); clearTimeout(cutT); };
  }, [still]);

  const toggleSound = () => {
    const a = window.__gtrAudio;
    if (!a) return;
    if (a.paused) a.play().catch(() => {}); else a.pause();
  };

  const shot = SHOTS[idx];
  return (
    <div ref={box} className={'reel' + (cut ? ' cut' : '') + (sync ? ' sync' : '')}>
      {still ? (
         
        <img className="reel-layer on" src="/assets/video/hero-reel.jpg" alt="" />
      ) : SHOTS.map((s, i) => {
        const on = i === idx;
        const near = on || i === (idx + 1) % SHOTS.length;
        return s.kind === 'video' ? (
          <video key={i} ref={(el) => { vids.current[i] = el; }} className={'reel-layer' + (on ? ' on' : '')}
            src={s.src} muted playsInline loop preload={near ? 'auto' : 'metadata'} aria-hidden
            poster={s.src.replace('.mp4', '.jpg')} />
        ) : (
           
          <img key={i} className={'reel-layer kb' + (on ? ' on' : '')} src={s.src} alt="" style={{ objectPosition: s.pos }} />
        );
      })}
      <div className="reel-grade" aria-hidden />
      <div className="reel-flash" aria-hidden />
      <div className="reel-kick" aria-hidden />
      <div className="reel-hud" aria-hidden>
        <span className="rec"><i />REC</span>
        <span ref={tcRef} className="g tc">00:00:00:00</span>
        <span className="shot">SHOT {pad(idx + 1)} / {pad(SHOTS.length)} · {shot.label}</span>
        <span className="brand">BANGTAOSTYLE.COM · PROTOCOL 10.10</span>
        <div className="ticks">{SHOTS.map((_, i) => <b key={i} className={i < idx ? 'done' : i === idx ? 'on' : ''} />)}</div>
      </div>
      {!still && (
        <button type="button" className="reel-snd" data-audio-ui onClick={toggleSound}
          aria-label={sync ? 'Pause soundtrack' : 'Play soundtrack'}>
          <span className="eq" aria-hidden><i /><i /><i /><i /></span>
          {sync ? `IN SYNC · ${Math.round(bpm)} BPM` : 'SOUND ON · SOUNDTRACK'}
        </button>
      )}
    </div>
  );
}
