'use client';
import { useEffect, useRef, useState } from 'react';

/**
 * Full-viewport backdrop that tells the route's story while you scroll:
 * each section has a scene photo that "develops" out of a red/white glyph matrix
 * and dissolves into the next one. Cheap: one canvas, ~20 fps, paused off-screen.
 */
const SCENES: Record<string, string> = {
  top: '/assets/places/phuket/03-aerial-beach.jpg',
  route: '/assets/story/bangkok-night.jpg',
  rig: '/assets/video/car-3.jpg',
  events: '/assets/places/phuket/05-neon-night.jpg',
  live: '/assets/places/phuket/05-neon-night.jpg',
  cars: '/assets/cars/02.jpg',
  realty: '/assets/places/samui/03-scene.jpg',
  lines: '/assets/places/chiangmai/01-scene.jpg',
  scales: '/assets/places/ayutthaya/02-scene.jpg',
  places: '/assets/story/north-mist.jpg',
  logbook: '/assets/places/samui/03-scene.jpg',
  'gtr-reality': '/assets/places/ayutthaya/01-scene.jpg',
  crew: '/assets/places/pattaya/03-scene.jpg',
  tiers: '/assets/places/bangkok/01-scene.jpg',
  invite: '/assets/places/phangan/02-scene.jpg',
  sponsors: '/assets/cars/06.jpg',
};
const GLYPHS = 'กขคงจฉชซญฎฐณดตถทธนบปผพฟภมยรลวศษสหอฮ0123456789ABCDEF#%&$';

interface Sampled { cols: number; rows: number; lum: Float32Array; img: HTMLImageElement }

export function StoryBackdrop() {
  const cv = useRef<HTMLCanvasElement | null>(null);
  // Phones: a fixed full-screen canvas under the content makes the browser composite the whole page
  // into dozens of layers (→ iOS kills and reloads the tab). They get pre-rendered per-section
  // backgrounds instead (public/assets/codebg, scripts/gen-codebg.py, CSS in hub.css).
  const [lite] = useState(() => window.matchMedia('(hover: none), (max-width: 760px)').matches);

  useEffect(() => {
    const canvas = cv.current;
    if (lite || !canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // phones: fewer, bigger cells at ~10 fps and 1× pixels — the glyph field stays, the battery too
    const interval = reduce ? 1000 : lite ? 100 : 50;
    const cache = new Map<string, Promise<HTMLImageElement>>();
    const load = (src: string) => {
      if (!cache.has(src)) cache.set(src, new Promise((res, rej) => { const i = new Image(); i.decoding = 'async'; i.onload = () => res(i); i.onerror = rej; i.src = src; }));
      return cache.get(src)!;
    };

    let W = 0, H = 0, cell = 16, cols = 0, rows = 0, dpr = 1;
    let cur: Sampled | null = null, next: Sampled | null = null;
    let mix = 1, seed = new Float32Array(0), chars = new Uint16Array(0);
    let curKey = '', raf = 0, lastT = 0, visible = true;

    const sample = (img: HTMLImageElement): Sampled => {
      const off = document.createElement('canvas');
      off.width = cols; off.height = rows;
      const o = off.getContext('2d')!;
      // cover-fit
      const s = Math.max(cols / img.width, rows / img.height);
      const w = img.width * s, h = img.height * s;
      o.drawImage(img, (cols - w) / 2, (rows - h) / 2, w, h);
      const d = o.getImageData(0, 0, cols, rows).data;
      const lum = new Float32Array(cols * rows);
      for (let i = 0; i < cols * rows; i++) lum[i] = (0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]) / 255;
      return { cols, rows, lum, img };
    };

    const resize = () => {
      dpr = lite ? 1 : Math.min(1.5, window.devicePixelRatio || 1);
      W = window.innerWidth; H = window.innerHeight;
      cell = lite ? 17 : W < 600 ? 13 : 16;
      canvas.width = Math.floor(W * dpr); canvas.height = Math.floor(H * dpr);
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      cols = Math.ceil(W / cell); rows = Math.ceil(H / cell);
      seed = new Float32Array(cols * rows).map(() => Math.random());
      chars = new Uint16Array(cols * rows).map(() => Math.floor(Math.random() * GLYPHS.length));
      dirty = true; underFor = null;
      if (cur) cur = sample(cur.img);
      if (next) next = sample(next.img);
    };

    const go = (key: string) => {
      const src = SCENES[key];
      if (!src || key === curKey) return;
      curKey = key;
      load(src).then((img) => {
        if (curKey !== key) return;
        const s = sample(img);
        if (!cur) { cur = s; mix = 1; } else { if (next) cur = next; next = s; mix = 0; }
      }).catch(() => {});
    };

    // Underlay (bg + dim photo) is cached per scene; in steady state only the ~2% of cells whose
    // glyph flickers are repainted (copy the underlay cell back, draw the new glyph). Full redraws
    // happen only while one scene dissolves into the next.
    const under = document.createElement('canvas');
    const uctx = under.getContext('2d', { alpha: false })!;
    let underFor: Sampled | null = null, dirty = true;
    const paintUnder = (base: Sampled) => {
      under.width = canvas.width; under.height = canvas.height;
      uctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      uctx.fillStyle = '#0a0b0d'; uctx.fillRect(0, 0, W, H);
      const s = Math.max(W / base.img.width, H / base.img.height);
      uctx.globalAlpha = 0.16;
      uctx.drawImage(base.img, (W - base.img.width * s) / 2, (H - base.img.height * s) / 2, base.img.width * s, base.img.height * s);
      uctx.globalAlpha = 1;
      underFor = base;
    };
    const glyph = (i: number, x: number, y: number, l: number, edge: boolean) => {
      const a = edge ? 0.9 : Math.min(0.55, (l - 0.15) * 0.75);
      ctx.fillStyle = edge ? `rgba(255,52,39,${a})` : l > 0.62 ? `rgba(255,255,255,${a})` : `rgba(229,35,27,${a * 0.9})`;
      ctx.fillText(GLYPHS[chars[i]], x * cell, y * cell);
    };

    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);
      if (!visible || t - lastT < interval) return;
      const dt = Math.min(200, t - lastT); lastT = t;
      if (next) { mix = Math.min(1, mix + dt / 1400); if (mix >= 1) { cur = next; next = null; mix = 1; dirty = true; } }
      if (!cur) return;
      const base = next && mix > 0.5 ? next : cur;
      if (underFor !== base || under.width !== canvas.width) { paintUnder(base); dirty = true; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `${cell - 3}px "JetBrains Mono", monospace`;
      ctx.textBaseline = 'top';
      const flick = reduce ? 0 : 0.02;

      if (next || dirty) {
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(under, 0, 0); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            const i = y * cols + x;
            const src = next && seed[i] < mix ? next : cur;
            const l = src.lum[i];
            const edge = !!next && Math.abs(seed[i] - mix) < 0.06;
            if (l < 0.18 && !edge) continue;
            if (Math.random() < flick) chars[i] = Math.floor(Math.random() * GLYPHS.length);
            glyph(i, x, y, l, edge);
          }
        }
        dirty = false;
        return;
      }
      const n = Math.ceil(cols * rows * flick), cd = cell * dpr;
      for (let k = 0; k < n; k++) {
        const i = Math.floor(Math.random() * cols * rows);
        const l = cur.lum[i];
        if (l < 0.18) continue;
        const x = i % cols, y = (i - x) / cols;
        chars[i] = Math.floor(Math.random() * GLYPHS.length);
        ctx.drawImage(under, x * cd, y * cd, cd, cd, x * cell, y * cell, cell, cell);
        glyph(i, x, y, l, false);
      }
    };

    resize();
    window.addEventListener('resize', resize);
    const onVis = () => { visible = document.visibilityState === 'visible'; };
    document.addEventListener('visibilitychange', onVis);

    // pick the scene of the section that occupies the middle of the viewport
    const pick = () => {
      const mid = window.innerHeight * 0.45;
      let best = 'top';
      document.querySelectorAll<HTMLElement>('main > section[id]').forEach((sec) => {
        const r = sec.getBoundingClientRect();
        if (r.top <= mid && r.bottom > mid) best = sec.id;
      });
      go(best);
    };
    pick();
    window.addEventListener('scroll', pick, { passive: true });
    const mo = new MutationObserver(pick);
    mo.observe(document.body, { childList: true, subtree: false });
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf); mo.disconnect();
      window.removeEventListener('resize', resize); window.removeEventListener('scroll', pick);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [lite]);

  if (lite) return null;
  return (
    <div className="story-bg" aria-hidden>
      <canvas ref={cv} />
      <div className="story-shade" />
    </div>
  );
}
