'use client';
/**
 * UI sound design for the reality-game feel. Everything is synthesized with WebAudio
 * (no files): hover tick, click, decode chatter, reveal sweep, map ping.
 * Starts muted until the first user gesture (browser autoplay rules); the viewer can mute it.
 */

type Kind = 'tick' | 'click' | 'reveal' | 'decode' | 'ping' | 'open';

const LS = 'gtrpht_sfx_off';
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
const last: Record<string, number> = {};
const listeners = new Set<(on: boolean) => void>();

export function sfxEnabled(): boolean {
  try { return localStorage.getItem(LS) !== '1'; } catch { return true; }
}
export function setSfxEnabled(on: boolean) {
  try { if (on) localStorage.removeItem(LS); else localStorage.setItem(LS, '1'); } catch { /* ignore */ }
  listeners.forEach((f) => f(on));
}
export function onSfxChange(f: (on: boolean) => void) { listeners.add(f); return () => { listeners.delete(f); }; }

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.22;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

/** Call from a user gesture once so later hovers can make sound. */
export function unlockSfx() { ac(); }

function env(g: GainNode, t: number, a: number, peak: number, d: number) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
}

export function sfx(kind: Kind) {
  if (!sfxEnabled() || !ctx || ctx.state !== 'running' || !master) return;
  const now = performance.now();
  const gap = kind === 'tick' ? 45 : kind === 'decode' ? 30 : 60;
  if (now - (last[kind] || 0) < gap) return;
  last[kind] = now;
  const c = ctx, t = c.currentTime, out = master;

  if (kind === 'tick' || kind === 'decode') {
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'square';
    o.frequency.value = kind === 'tick' ? 2400 + Math.random() * 400 : 900 + Math.random() * 2200;
    env(g, t, 0.002, kind === 'tick' ? 0.12 : 0.05, 0.03);
    o.connect(g).connect(out); o.start(t); o.stop(t + 0.05);
  } else if (kind === 'click') {
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(1400, t);
    o.frequency.exponentialRampToValueAtTime(320, t + 0.09);
    env(g, t, 0.003, 0.5, 0.12);
    o.connect(g).connect(out); o.start(t); o.stop(t + 0.16);
  } else if (kind === 'reveal' || kind === 'open') {
    // filtered noise sweep + low thump
    const len = kind === 'open' ? 0.5 : 0.8;
    const buf = c.createBuffer(1, Math.floor(c.sampleRate * len), c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const n = c.createBufferSource(); n.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 6;
    f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(6000, t + len * 0.85);
    const g = c.createGain(); env(g, t, 0.05, 0.25, len * 0.9);
    n.connect(f).connect(g).connect(out); n.start(t); n.stop(t + len);
    const o = c.createOscillator(), g2 = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.3);
    env(g2, t, 0.005, 0.6, 0.35); o.connect(g2).connect(out); o.start(t); o.stop(t + 0.4);
  } else if (kind === 'ping') {
    [0, 0.09].forEach((dt, i) => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'sine'; o.frequency.value = i ? 1760 : 1320;
      env(g, t + dt, 0.004, 0.35, 0.35); o.connect(g).connect(out); o.start(t + dt); o.stop(t + dt + 0.4);
    });
  }
}
