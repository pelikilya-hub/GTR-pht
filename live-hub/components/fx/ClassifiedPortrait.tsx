'use client';
import { useEffect, useRef } from 'react';

/**
 * Participant 02 · GTR — "image classified". An abstract, code-drawn silhouette (no photo, nothing
 * identifiable) that keeps being generated out of glyphs, row after row, and never resolves:
 * decryption hangs in the high nineties, a CLASSIFIED stamp sits on top. Paused off-screen.
 */
const GLYPHS = '01ABCDEF#%&$@<>/\\{}[]=+*ЖЩЯФДΩΣΔ';

function silhouette(w: number, h: number): Float32Array {
  // a stylised bust with long hair — drawn procedurally, then read back as a density mask
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d')!;
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#fff';
  const cx = w * 0.52, hy = h * 0.34, hr = w * 0.15;
  // hair mass
  g.beginPath(); g.ellipse(cx - w * 0.02, hy + hr * 0.6, hr * 1.55, hr * 2.25, -0.08, 0, Math.PI * 2); g.globalAlpha = 0.55; g.fill();
  // head
  g.globalAlpha = 1; g.beginPath(); g.ellipse(cx, hy, hr * 0.92, hr * 1.18, 0.1, 0, Math.PI * 2); g.fill();
  // neck + shoulders
  g.beginPath(); g.moveTo(cx - hr * 0.42, hy + hr); g.lineTo(cx + hr * 0.42, hy + hr);
  g.lineTo(cx + hr * 0.55, hy + hr * 1.9);
  g.bezierCurveTo(cx + w * 0.38, hy + hr * 2.1, cx + w * 0.46, h * 0.82, cx + w * 0.48, h);
  g.lineTo(cx - w * 0.5, h);
  g.bezierCurveTo(cx - w * 0.46, h * 0.82, cx - w * 0.36, hy + hr * 2.1, cx - hr * 0.55, hy + hr * 1.9);
  g.closePath(); g.globalAlpha = 0.85; g.fill();
  // a raised hand with a cigarette glow — the only "detail"
  g.globalAlpha = 1; g.beginPath(); g.ellipse(cx + w * 0.2, h * 0.62, w * 0.05, h * 0.07, 0.4, 0, Math.PI * 2); g.fill();
  const d = g.getImageData(0, 0, w, h).data, m = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) m[i] = d[i * 4] / 255;
  return m;
}

export function ClassifiedPortrait() {
  const cv = useRef<HTMLCanvasElement | null>(null);
  const pct = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const canvas = cv.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lite = window.matchMedia('(hover: none), (max-width: 760px)').matches;
    let W = 0, H = 0, cols = 0, rows = 0, cell = 12, dpr = 1;
    let mask: Float32Array = new Float32Array(0), chars: Uint8Array = new Uint8Array(0);
    let raf = 0, last = 0, visible = false, scan = 0;
    const t0 = performance.now();

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = r.width; H = r.height; canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      cell = W < 360 ? 10 : 12;
      cols = Math.ceil(W / cell); rows = Math.ceil(H / cell);
      mask = silhouette(cols, rows);
      chars = new Uint8Array(cols * rows).map(() => Math.floor(Math.random() * GLYPHS.length));
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.05 });
    io.observe(canvas);

    const draw = (ts: number) => {
      raf = requestAnimationFrame(draw);
      if (!visible || document.hidden || ts - last < (reduce ? 1000 : lite ? 66 : 45)) return;
      last = ts;
      const t = (ts - t0) / 1000;
      // generation sweep: rows get "written" top → bottom, then the image dissolves and is regenerated
      scan = (t * 0.22) % 1.25;
      const genRow = Math.floor(scan * rows);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#09090b'; ctx.fillRect(0, 0, W, H);
      ctx.font = `${cell - 1}px "JetBrains Mono", monospace`;
      ctx.textBaseline = 'top';
      // glitch: occasional horizontal band offset
      const gBand = Math.random() < 0.08 ? Math.floor(Math.random() * rows) : -1;
      for (let y = 0; y < rows; y++) {
        const off = y >= gBand && y < gBand + 3 ? (Math.random() - 0.5) * cell * 3 : 0;
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          const m = mask[i];
          const written = y < genRow;
          if (Math.random() < 0.06) chars[i] = Math.floor(Math.random() * GLYPHS.length);
          let a: number, col: string;
          if (y === genRow) { a = 0.95; col = '255,255,255'; }
          else if (!written) { if (Math.random() > 0.12) continue; a = 0.12; col = '229,35,27'; }
          else if (m > 0.4) { a = 0.25 + m * 0.6 * (0.7 + 0.3 * Math.sin(t * 3 + x * 0.3 + y * 0.2)); col = m > 0.9 ? '255,255,255' : '229,35,27'; }
          else { if (Math.random() > 0.35) continue; a = 0.08; col = '229,35,27'; }
          ctx.fillStyle = `rgba(${col},${a.toFixed(2)})`;
          ctx.fillText(GLYPHS[chars[i]], x * cell + off, y * cell);
        }
      }
      // cigarette ember
      const ex = (cols * 0.72) * cell, ey = (rows * 0.6) * cell, glow = 0.5 + 0.5 * Math.sin(t * 2.2);
      const gr = ctx.createRadialGradient(ex, ey, 0, ex, ey, cell * 3);
      gr.addColorStop(0, `rgba(255,120,40,${0.55 * glow + 0.25})`); gr.addColorStop(1, 'rgba(255,60,20,0)');
      ctx.fillStyle = gr; ctx.fillRect(ex - cell * 3, ey - cell * 3, cell * 6, cell * 6);
      // scan line
      ctx.fillStyle = 'rgba(255,52,39,.85)'; ctx.fillRect(0, genRow * cell, W, 1.5);
      // decryption never completes
      if (pct.current) pct.current.textContent = (scan < 1 ? Math.min(99, Math.floor(scan * 99)) : 99) + '.' + Math.floor(Math.random() * 9) + '%';
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); };
  }, []);

  return (
    <div className="classified" aria-label="Образ засекречен">
      <canvas ref={cv} />
      <div className="cl-stamp">ЗАСЕКРЕЧЕНО</div>
      <div className="cl-hud meta">
        <span>ДЕШИФРОВКА <span ref={pct}>0%</span></span>
        <span>ДОСТУП: ЭКИПАЖ · РАСКРЫТИЕ В ЭФИРЕ</span>
      </div>
    </div>
  );
}
