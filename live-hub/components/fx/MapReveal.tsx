'use client';
import { useEffect, useRef, useState } from 'react';
import { sfx } from '@/lib/sfx';

const G = 'กขคงจฉชซญฎฐณดตถทธนบปผพฟภมยรลวศษสหอฮ0123456789ABCDEF';

/** Glyph matrix laid over the map that burns away in a wave from the centre when the map scrolls in. */
export function MapReveal() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { requestAnimationFrame(() => setGone(true)); return; }
    const ctx = cv.getContext('2d')!;
    const parent = cv.parentElement!;
    const cell = 15;
    let W = 0, H = 0, cols = 0, rows = 0, raf = 0, t0 = 0;
    let seed = new Float32Array(0);
    const size = () => {
      const r = parent.getBoundingClientRect(), dpr = Math.min(1.5, devicePixelRatio || 1);
      W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(W / cell); rows = Math.ceil(H / cell);
      seed = new Float32Array(cols * rows).map(() => Math.random());
    };
    size();
    const draw = (t: number) => {
      const p = t0 ? Math.min(1, (t - t0) / 2600) : 0;
      ctx.clearRect(0, 0, W, H);
      ctx.font = `${cell - 2}px "JetBrains Mono", monospace`;
      ctx.textBaseline = 'top';
      const cx = cols / 2, cy = rows / 2, maxD = Math.hypot(cx, cy);
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        const i = y * cols + x;
        const d = Math.hypot(x - cx, y - cy) / maxD;              // 0 centre → 1 corner
        const front = p * 1.35 - d - seed[i] * 0.25;               // >0 = already revealed
        if (front > 0.12) continue;
        const edge = front > -0.05;
        if (!edge) { ctx.fillStyle = 'rgba(10,11,13,.94)'; ctx.fillRect(x * cell, y * cell, cell, cell); }
        ctx.fillStyle = edge ? 'rgba(255,255,255,.95)' : seed[i] > 0.72 ? 'rgba(255,52,39,.85)' : 'rgba(229,35,27,.3)';
        ctx.fillText(G[(i * 13 + Math.floor(t / 90)) % G.length], x * cell, y * cell);
      }
      if (p < 1) raf = requestAnimationFrame(draw); else setGone(true);
    };
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !t0) { t0 = performance.now(); sfx('reveal'); }
    }, { threshold: 0.35 });
    io.observe(parent);
    raf = requestAnimationFrame(draw);
    window.addEventListener('resize', size);
    return () => { io.disconnect(); cancelAnimationFrame(raf); window.removeEventListener('resize', size); };
  }, []);

  if (gone) return null;
  return <canvas ref={ref} className="map-reveal" aria-hidden />;
}
