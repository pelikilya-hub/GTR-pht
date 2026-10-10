'use client';
import { useEffect } from 'react';
import Lenis from 'lenis';

declare global {
  interface Window { __lenis?: Lenis }
}

/**
 * Cinematic scroll engine.
 * - Lenis inertia scrolling (anchors handled, chat/map/popups excluded).
 * - Every `main > section` gets CSS vars on each frame:
 *     --p  0→1 while the section travels through the viewport (parallax)
 *     --e  0→1 as the section enters (top edge from 100% → 35% of the viewport)
 *     --x  0→1 as the section leaves upwards (used by the hero dolly-out)
 * - :root gets --v (scroll velocity, 0..1) and --lb (letterbox bar height) for
 *   motion blur / chromatic split and cinematic bars during fast moves.
 */
export function ScrollFX() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const root = document.documentElement;
    const lenis = new Lenis({
      lerp: 0.085,
      smoothWheel: true,
      anchors: { offset: -70 },
      autoRaf: false,
      prevent: (node) => !!node.closest?.('.chat-list, .maplibregl-map, .maplibregl-popup, .sheet, [data-lenis-prevent]'),
    });
    window.__lenis = lenis;

    let raf = 0, vel = 0, lb = 0;
    const clamp = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      lenis.raf(t);
      if (reduce) return;
      const vh = window.innerHeight;
      document.querySelectorAll<HTMLElement>('main > section').forEach((s) => {
        const r = s.getBoundingClientRect();
        if (r.bottom < -vh || r.top > vh * 2) return;
        s.style.setProperty('--p', clamp((vh - r.top) / (vh + r.height)).toFixed(4));
        s.style.setProperty('--e', clamp((vh - r.top) / (vh * 0.65)).toFixed(4));
        s.style.setProperty('--x', clamp(-r.top / Math.max(1, r.height)).toFixed(4));
      });
      const v = Math.min(1, Math.abs(lenis.velocity || 0) / 60);
      vel += (v - vel) * 0.12;
      lb += ((vel > 0.35 ? 1 : 0) - lb) * 0.06;
      root.style.setProperty('--v', vel.toFixed(3));
      root.style.setProperty('--lb', lb.toFixed(3));
      root.style.setProperty('--sy', String(Math.round(lenis.scroll)));
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); lenis.destroy(); delete window.__lenis; };
  }, []);

  return (
    <>
      <div className="lb lb-top" aria-hidden />
      <div className="lb lb-bot" aria-hidden />
    </>
  );
}
