'use client';
import { useEffect, useRef } from 'react';

/**
 * Isometric "3D packaging" of a property on a 2D canvas (no WebGL, cheap on phones):
 * buildings rise out of the plot, a laser scan sweeps the site and turns raw grey massing into
 * packaged white-line models with callouts. Drag to rotate; auto-orbits when idle; paused off-screen.
 */
export type VillageKind = 'villas' | 'condo' | 'eco';

interface Item {
  t: 'box' | 'flat' | 'palm';
  x: number; z: number; w: number; d: number; h: number; y0: number;
  tone?: 'pool' | 'road' | 'deck' | 'glass';
  label?: string; delay: number;
}

function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

function build(kind: VillageKind, ru: boolean): Item[] {
  const r = rng(kind === 'villas' ? 7 : kind === 'condo' ? 11 : 23);
  const out: Item[] = [];
  const box = (x: number, z: number, w: number, d: number, h: number, y0 = 0, extra: Partial<Item> = {}) =>
    out.push({ t: 'box', x, z, w, d, h, y0, delay: 0, ...extra });
  const flat = (x: number, z: number, w: number, d: number, tone: Item['tone'], y0 = 0) =>
    out.push({ t: 'flat', x, z, w, d, h: 0, y0, tone, delay: 0 });
  const palm = (x: number, z: number, y0 = 0) => out.push({ t: 'palm', x, z, w: 0, d: 0, h: 1.1 + r() * 0.5, y0, delay: 0 });

  if (kind === 'villas') {
    flat(0, 0, 12.4, 1.1, 'road'); flat(0, 0, 1.1, 12.4, 'road');
    const spots = [-4.6, -2.2, 2.2, 4.6];
    for (const x of spots) for (const z of spots) {
      if (Math.abs(x) < 3 && Math.abs(z) < 3 && x > 0 && z > 0) continue; // clubhouse corner
      const big = r() > 0.6;
      box(x - 0.25, z - 0.2, big ? 1.5 : 1.25, 1.1, 0.55);
      box(x - 0.45, z - 0.35, big ? 0.9 : 0.7, 0.7, 0.45, 0.55);
      flat(x + 0.55, z + 0.55, 0.75, 0.5, 'pool');
      if (r() > 0.45) palm(x + 0.85, z - 0.75);
    }
    box(2.2, 2.2, 2.6, 1.6, 0.7, 0, { label: ru ? 'КЛАБ-ХАУС' : 'CLUBHOUSE', tone: 'glass' });
    flat(2.2, 3.55, 2.4, 0.9, 'pool');
    out.find((i) => i.t === 'box' && i.x < -4)!.label = ru ? 'ВИЛЛА 3BR' : 'VILLA 3BR';
    for (let i = 0; i < 7; i++) palm(-6 + r() * 12, 6.1 + r() * 0.4);
  } else if (kind === 'condo') {
    flat(0, 0, 10.5, 8.5, 'deck');
    box(0, 0, 9.5, 7, 0.6, 0, { tone: 'glass' }); // podium
    box(-2.6, -1.6, 2.2, 2.2, 4.4, 0.6, { label: ru ? 'БАШНЯ A · 32 ЭТ.' : 'TOWER A · 32 FL', tone: 'glass' });
    box(1.4, -1.9, 2.0, 2.0, 3.4, 0.6, { tone: 'glass' });
    box(2.9, 1.7, 2.4, 1.8, 2.4, 0.6, { tone: 'glass' });
    flat(-1.2, 1.9, 3.2, 1.3, 'pool', 0.6);
    out[out.length - 1].label = ru ? 'БАССЕЙН НА КРЫШЕ ПОДИУМА' : 'PODIUM ROOFTOP POOL';
    for (let i = 0; i < 9; i++) palm(-5 + i * 1.25, 4.9);
    flat(0, 5.9, 12, 0.9, 'road');
  } else {
    // terraced hillside: three levels
    const levels = [[-4, 0], [-1, 0.6], [2.4, 1.2]];
    levels.forEach(([z, y], li) => {
      flat(0, z, 12, 2.6, 'deck', y);
      box(0, z - 1.35, 12, 0.08, y + 0.02, 0); // retaining wall line
      for (let k = 0; k < 4 + li; k++) {
        const x = -5 + k * (10 / (3 + li)) + (r() - 0.5) * 0.6;
        box(x, z + (r() - 0.5) * 0.4, 1.1, 1.1, 0.5, y);
        box(x, z + (r() - 0.5) * 0.2, 0.7, 0.7, 0.25, y + 0.5);
        if (r() > 0.4) palm(x + 0.9, z + 0.8, y);
      }
    });
    box(0, 5, 3.2, 1.6, 0.8, 1.8, { label: ru ? 'ЙОГА-ШАЛА · ВИД НА ГОРЫ' : 'YOGA SHALA · MOUNTAIN VIEW', tone: 'glass' });
    flat(-3.8, 5.1, 2.4, 1.1, 'pool', 1.8);
    out.find((i) => i.t === 'box' && i.h === 0.5)!.label = ru ? 'БУНГАЛО' : 'BUNGALOW';
  }
  // build order: from the centre outwards
  out.forEach((i) => { i.delay = Math.hypot(i.x, i.z) * 0.09 + (i.t === 'flat' ? 0 : 0.15) + i.y0 * 0.15; });
  return out;
}

export function Village3D({ kind, ru }: { kind: VillageKind; ru: boolean }) {
  const cv = useRef<HTMLCanvasElement | null>(null);
  const state = useRef({ yaw: -0.55, vel: 0, drag: false, lx: 0, idleAt: 0 });

  useEffect(() => {
    const canvas = cv.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lite = window.matchMedia('(hover: none), (max-width: 760px)').matches;
    const items = build(kind, ru);
    const packaged = new Set<Item>();
    let W = 0, H = 0, dpr = 1, raf = 0, last = 0, visible = false;
    let t0 = -1; // build start (ms), set when first visible
    const st = state.current;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(lite ? 1.5 : 2, window.devicePixelRatio || 1);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && t0 < 0) t0 = performance.now(); }, { threshold: 0.1 });
    io.observe(canvas);

    // drag to orbit
    const down = (e: PointerEvent) => { st.drag = true; st.lx = e.clientX; st.vel = 0; canvas.setPointerCapture(e.pointerId); };
    const move = (e: PointerEvent) => { if (!st.drag) return; const dx = e.clientX - st.lx; st.lx = e.clientX; st.yaw += dx * 0.008; st.vel = dx * 0.008; };
    const up = () => { st.drag = false; st.idleAt = performance.now(); };
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);

    const easeBack = (x: number) => { const c = 1.6; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible || document.hidden || now - last < (lite ? 40 : 16)) return;
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      if (!st.drag) {
        st.vel *= 0.94;
        st.yaw += st.vel + (reduce || now - st.idleAt < 1800 ? 0 : dt * 0.12);
      }
      const tb = t0 < 0 ? 0 : (now - t0) / 1000;
      const scan = reduce ? 99 : -7.5 + (((tb - 1.2) / 5.5) % 1 + 1) % 1 * 15; // world-x of the laser plane
      const ca = Math.cos(st.yaw), sa = Math.sin(st.yaw);
      // leave room for the HUD title (top-left) and the tabs (bottom)
      const s = Math.min(W / 19, H / 13.5);
      const cx = W * (W > 700 ? 0.56 : 0.5), cy = H * 0.54;
      const P = (x: number, y: number, z: number): [number, number, number] => {
        const xr = x * ca - z * sa, zr = x * sa + z * ca;
        return [cx + (xr - zr) * 0.866 * s, cy + (xr + zr) * 0.5 * s - y * s * 1.05, xr + zr];
      };

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      // ground grid
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255,255,255,.06)';
      ctx.beginPath();
      for (let g = -7; g <= 7; g++) {
        let a = P(g, 0, -7), b = P(g, 0, 7); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
        a = P(-7, 0, g); b = P(7, 0, g); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
      }
      ctx.stroke();
      // plot boundary
      ctx.setLineDash([6, 5]); ctx.strokeStyle = 'rgba(229,35,27,.55)';
      ctx.beginPath();
      [[-6.6, -6.6], [6.6, -6.6], [6.6, 6.6], [-6.6, 6.6]].forEach(([x, z], i) => { const p = P(x, 0, z); if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); });
      ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);

      const grow = (it: Item) => Math.max(0, Math.min(1, (tb - it.delay) / 0.55));
      const edgeOf = (it: Item) => {
        if (Math.abs(it.x - scan) < 0.7) { packaged.add(it); return 'rgba(255,52,39,1)'; }
        return packaged.has(it) ? 'rgba(255,255,255,.78)' : 'rgba(255,255,255,.2)';
      };

      // flats first (ground layer), sorted far → near
      const flats = items.filter((i) => i.t === 'flat');
      const solids = items.filter((i) => i.t !== 'flat');
      const depth = (i: Item) => P(i.x, i.y0, i.z)[2] + i.y0 * 0.01;
      flats.sort((a, b) => depth(a) - depth(b)).forEach((it) => {
        const g = grow(it); if (!g) return;
        const w = it.w / 2 * g, d = it.d / 2 * g;
        const pts = [[-w, -d], [w, -d], [w, d], [-w, d]].map(([dx, dz]) => P(it.x + dx, it.y0 + 0.01, it.z + dz));
        ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath();
        ctx.fillStyle = it.tone === 'pool' ? 'rgba(90,169,255,.38)' : it.tone === 'road' ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,.035)';
        ctx.fill();
        ctx.strokeStyle = it.tone === 'pool' ? 'rgba(120,190,255,.85)' : edgeOf(it);
        ctx.lineWidth = 1; ctx.stroke();
      });

      const labels: [number, number, string][] = [];
      solids.sort((a, b) => depth(a) - depth(b)).forEach((it) => {
        const g = grow(it); if (!g) return;
        if (it.t === 'palm') {
          const h = it.h * easeBack(g);
          const a = P(it.x, it.y0, it.z), b = P(it.x, it.y0 + h, it.z);
          ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
          for (let k = 0; k < 5; k++) { const an = k * 1.257 + st.yaw; ctx.moveTo(b[0], b[1]); ctx.lineTo(b[0] + Math.cos(an) * s * 0.42, b[1] + Math.sin(an) * s * 0.2 + s * 0.12); }
          ctx.stroke();
          return;
        }
        const h = it.h * easeBack(g), y0 = it.y0, w = it.w / 2, d = it.d / 2;
        const edge = edgeOf(it);
        const hot = edge.startsWith('rgba(255,52');
        // side faces: normals in world space, visible when facing the camera (+x' +z')
        const sides: [number, number, [number, number][]][] = [
          [1, 0, [[w, -d], [w, d]]], [-1, 0, [[-w, d], [-w, -d]]], [0, 1, [[w, d], [-w, d]]], [0, -1, [[-w, -d], [w, -d]]],
        ];
        for (const [nx, nz, [[ax, az], [bx, bz]]] of sides) {
          const nxr = nx * ca - nz * sa, nzr = nx * sa + nz * ca;
          if (nxr + nzr <= 0) continue;
          const q = [P(it.x + ax, y0, it.z + az), P(it.x + bx, y0, it.z + bz), P(it.x + bx, y0 + h, it.z + bz), P(it.x + ax, y0 + h, it.z + az)];
          ctx.beginPath(); q.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath();
          const shade = nxr > nzr ? 0.94 : 0.88;
          ctx.fillStyle = it.tone === 'glass' ? `rgba(30,32,40,${shade})` : `rgba(20,21,25,${shade})`;
          ctx.fill();
          ctx.strokeStyle = edge; ctx.lineWidth = hot ? 1.6 : 1; ctx.stroke();
          // floor lines on tall volumes
          if (h > 1.2) {
            ctx.strokeStyle = hot ? 'rgba(255,52,39,.5)' : packaged.has(it) ? 'rgba(255,255,255,.16)' : 'rgba(255,255,255,.06)';
            ctx.beginPath();
            for (let fy = 0.3; fy < h - 0.1; fy += 0.3) {
              const a = P(it.x + ax, y0 + fy, it.z + az), b = P(it.x + bx, y0 + fy, it.z + bz);
              ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
            }
            ctx.stroke();
          }
        }
        const top = [[-w, -d], [w, -d], [w, d], [-w, d]].map(([dx, dz]) => P(it.x + dx, y0 + h, it.z + dz));
        ctx.beginPath(); top.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath();
        ctx.fillStyle = hot ? 'rgba(255,52,39,.28)' : packaged.has(it) ? 'rgba(52,54,62,.96)' : 'rgba(36,37,43,.96)';
        ctx.fill(); ctx.strokeStyle = edge; ctx.lineWidth = hot ? 1.6 : 1; ctx.stroke();
        if (it.label && packaged.has(it) && g >= 1) { const c = P(it.x, y0 + h, it.z); labels.push([c[0], c[1], it.label]); }
      });

      // laser plane: a red line across the plot at world x = scan
      if (scan > -7 && scan < 7) {
        const a = P(scan, 0, -6.8), b = P(scan, 0, 6.8), a2 = P(scan, 7, -6.8), b2 = P(scan, 7, 6.8);
        const gr = ctx.createLinearGradient(a[0], a[1], a2[0], a2[1]);
        gr.addColorStop(0, 'rgba(255,52,39,.22)'); gr.addColorStop(1, 'rgba(255,52,39,0)');
        ctx.fillStyle = gr;
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(b2[0], b2[1]); ctx.lineTo(a2[0], a2[1]); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#ff3427'; ctx.lineWidth = 2; ctx.shadowColor = '#ff3427'; ctx.shadowBlur = lite ? 0 : 12;
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.shadowBlur = 0;
      }

      // callouts
      ctx.font = `600 ${lite ? 9.5 : 10.5}px "JetBrains Mono", monospace`;
      ctx.textBaseline = 'middle';
      for (const [x, y, txt] of labels) {
        const ly = y - s * 1.1, tw = ctx.measureText(txt).width;
        ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, ly); ctx.lineTo(x + 10, ly); ctx.stroke();
        ctx.fillStyle = 'rgba(10,11,13,.85)'; ctx.fillRect(x + 10, ly - 10, tw + 14, 20);
        ctx.fillStyle = '#ff3427'; ctx.fillRect(x + 10, ly - 10, 2, 20);
        ctx.fillStyle = '#fff'; ctx.fillText(txt, x + 18, ly + 0.5);
        ctx.fillStyle = '#ff3427'; ctx.beginPath(); ctx.arc(x, y, 2.5, 0, 6.3); ctx.fill();
      }
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up); canvas.removeEventListener('pointercancel', up);
    };
  }, [kind, ru]);

  return <canvas ref={cv} className="v3d" aria-label={ru ? '3D-макет объекта, потяни чтобы повернуть' : '3D site model, drag to rotate'} />;
}
