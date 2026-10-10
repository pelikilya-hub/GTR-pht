'use client';
import { useEffect, useRef, useState } from 'react';
import { sfx } from '@/lib/sfx';

type Fx = 'glitch' | 'flash' | 'whip' | 'zoom' | 'rgb' | 'strobe';
type Shot = {
  kind: 'video' | 'image'; src: string; from?: number; beats: number; label: string; pos?: string;
  /** playback speed: fixed, or a ramp [start, end] eased across the shot (fast → slow-mo hits) */
  rate?: number | [number, number];
  /** transition into this shot */
  fx?: Fx;
};

/**
 * Trailer cut: the night drive with her (gloss, laughs, lighting up, smoking under the streetlight,
 * slow exhale), Ilia at the villa, party, fire show, sunset — intercut with the Bangtaostyle pickup. Cuts land on the beat grid of whatever playlist
 * track is playing (lib/beatmap.ts): the reel is then clocked by audio.currentTime; without sound it
 * runs its own clock at the soundtrack's 88 BPM. Shot lengths are in "units": one beat for slow
 * tracks, two beats above 120 BPM. 48 units = 12 bars per loop. `-slow` clips are motion-interpolated
 * half-speed renders, so the speed ramps into slow-mo stay smooth.
 */
const SHOTS: Shot[] = [
  { kind: 'video', src: '/assets/video/v-walk-slow.mp4', beats: 2, rate: [1.05, 0.85], fx: 'flash', pos: '52% 40%', label: 'POOLSIDE · ON THE PHONE' },
  { kind: 'video', src: '/assets/video/d-wheel.mp4', beats: 2, rate: 0.8, fx: 'whip', label: 'BMW · NIGHT START' },
  { kind: 'video', src: '/assets/video/g-lips.mp4', beats: 4, rate: [0.8, 0.5], fx: 'zoom', pos: '47% 40%', label: 'NIGHT · GLOSS' },
  { kind: 'video', src: '/assets/video/car-2.mp4', from: 0.2, beats: 2, rate: 1.25, fx: 'whip', label: 'NIGHT DRIFT · BANGTAO STYLE' },
  { kind: 'video', src: '/assets/video/g-laugh.mp4', beats: 2, rate: 1.2, fx: 'rgb', pos: '74% 30%', label: 'SHOTGUN SEAT · LAUGHS' },
  { kind: 'video', src: '/assets/video/v-sofa.mp4', beats: 2, rate: 1.5, fx: 'glitch', label: 'RECHARGE · BEFORE THE DRIVE' },
  { kind: 'video', src: '/assets/video/g-light.mp4', beats: 2, fx: 'strobe', pos: '18% 40%', label: 'LIGHT UP' },
  { kind: 'video', src: '/assets/video/g-smoke.mp4', beats: 4, rate: 1.2, fx: 'flash', pos: '8% 40%', label: 'SMOKE BREAK · STREETLIGHT' },
  { kind: 'video', src: '/assets/video/car-1.mp4', from: 5.6, beats: 2, fx: 'rgb', label: 'WHEELS · BTS ORANGE' },
  { kind: 'image', src: '/assets/crew/ilia-bangla.jpg', beats: 2, fx: 'flash', label: 'BANGLA ROAD · PATONG', pos: '50% 22%' },
  { kind: 'video', src: '/assets/video/v-sax.mp4', beats: 2, fx: 'whip', pos: '55% 40%', label: 'PARTY · SAX LIVE' },
  { kind: 'video', src: '/assets/video/v-fire-slow.mp4', beats: 4, rate: [1.6, 0.7], fx: 'strobe', pos: '50% 35%', label: 'FIRE SHOW · SLOW BURN' },
  { kind: 'video', src: '/assets/video/d-road.mp4', beats: 2, rate: 1.4, fx: 'zoom', label: 'NEON RUN' },
  { kind: 'video', src: '/assets/video/g-exhale-slow.mp4', beats: 4, rate: [1.2, 0.8], fx: 'glitch', pos: '8% 40%', label: 'EXHALE · SLOW' },
  { kind: 'video', src: '/assets/video/car-3.mp4', from: 0.6, beats: 2, fx: 'zoom', label: 'COAST RUN · ANDAMAN' },
  { kind: 'video', src: '/assets/video/car-2.mp4', from: 6.0, beats: 2, fx: 'glitch', label: 'SMOKE · MOONLIGHT' },
  { kind: 'video', src: '/assets/video/v-walk-slow.mp4', beats: 2, rate: [1.2, 0.75], fx: 'zoom', pos: '52% 40%', label: 'SUNSET · SCROLL' },
  { kind: 'video', src: '/assets/video/car-1.mp4', from: 9.0, beats: 2, rate: 1.2, fx: 'whip', label: 'HOOD · BANGTAOSTYLE.COM' },
  { kind: 'video', src: '/assets/video/v-palms.mp4', beats: 4, rate: [1, 0.6], fx: 'flash', pos: '45% 50%', label: 'SUNSET · PROTOCOL 10.10' },
];
const LOOP = SHOTS.reduce((s, x) => s + x.beats, 0);
const STARTS = SHOTS.map((_, i) => SHOTS.slice(0, i).reduce((s, x) => s + x.beats, 0));
const FREE_BPM = 88;

const pad = (n: number, l = 2) => String(n).padStart(l, '0');
const ease = (x: number) => x * x * (3 - 2 * x);
const rateAt = (r: Shot['rate'], p: number) => (Array.isArray(r) ? r[0] + (r[1] - r[0]) * ease(p) : r ?? 1);
const shotAt = (b: number) => { let i = SHOTS.length - 1; while (i > 0 && STARTS[i] > b) i--; return i; };

export function HeroReel() {
  const [idx, setIdx] = useState(0);
  const [cut, setCut] = useState(false);
  const [fx, setFx] = useState<Fx>('glitch');
  const [broken, setBroken] = useState<Set<string>>(() => new Set()); // clips this browser can't play → poster still
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
      try { v.currentTime = shot.from || 0; v.playbackRate = rateAt(shot.rate, 0); } catch { /* not loaded yet */ }
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
      // speed ramp of the running clip
      const cv = SHOTS[i].kind === 'video' ? vids.current[i] : null;
      if (cv && SHOTS[i].rate !== undefined) {
        const r = rateAt(SHOTS[i].rate, Math.min(1, (lb - STARTS[i] + frac) / SHOTS[i].beats));
        if (Math.abs(cv.playbackRate - r) > 0.03) cv.playbackRate = r;
      }

      if (i !== idxRef.current) {
        idxRef.current = i;
        setIdx(i);
        const f = SHOTS[i].fx || 'glitch';
        setFx(f);
        setCut(true);
        clearTimeout(cutT);
        cutT = window.setTimeout(() => setCut(false), f === 'whip' || f === 'strobe' ? 340 : 260);
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
    <div ref={box} className={'reel' + (cut ? ' cut fx-' + fx : '') + (sync ? ' sync' : '')}>
      {still ? (
         
        <img className="reel-layer on" src="/assets/video/v-walk-slow.jpg" alt="" style={{ objectPosition: "52% 45%" }} />
      ) : SHOTS.map((s, i) => {
        const on = i === idx;
        const near = on || i === (idx + 1) % SHOTS.length;
        // only the current shot and the next one exist in the DOM: every <video> holds a decoder
        // and frame buffers, and seven of them is enough for iOS to kill the tab
        if (!near) return null;
        return s.kind === 'video' && !broken.has(s.src) ? (
          <video key={i} ref={(el) => { vids.current[i] = el; }} className={'reel-layer' + (on ? ' on' : '')}
            src={s.src} muted playsInline loop preload="auto" aria-hidden
            onError={() => setBroken((b) => new Set(b).add(s.src))} style={{ objectPosition: s.pos }}
            poster={s.src.replace('.mp4', '.jpg')} />
        ) : (
           
          <img key={i} className={'reel-layer kb' + (on ? ' on' : '')} src={s.kind === 'video' ? s.src.replace('.mp4', '.jpg') : s.src} alt="" style={{ objectPosition: s.pos }} />
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
