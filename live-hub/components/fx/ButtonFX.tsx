'use client';
import { useEffect } from 'react';

const NOISE = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&@$/<>ЖЩЫЮЯФДЛБ';

/**
 * Makes every `.btn` on the page feel alive, by event delegation (no per-button wiring):
 * - magnetic pull towards the cursor (fine pointers only),
 * - label re-decodes through glyph noise on hover,
 * - press burst from the touch/click point + a short glitch kick.
 * Text nodes are restored only if React hasn't replaced them meanwhile.
 */
export function ButtonFX() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const busy = new WeakSet<HTMLElement>();
    const btnOf = (t: EventTarget | null) => (t as HTMLElement | null)?.closest?.('.btn') as HTMLElement | null;

    const scramble = (btn: HTMLElement) => {
      if (busy.has(btn)) return;
      const walker = document.createTreeWalker(btn, NodeFilter.SHOW_TEXT);
      const nodes: { n: Text; orig: string; last: string }[] = [];
      for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
        if (n.nodeValue && n.nodeValue.trim()) nodes.push({ n, orig: n.nodeValue, last: n.nodeValue });
      }
      if (!nodes.length) return;
      busy.add(btn);
      const t0 = performance.now(), dur = 380;
      const step = (t: number) => {
        const p = Math.min(1, (t - t0) / dur);
        for (const o of nodes) {
          if (o.n.nodeValue !== o.last) continue; // React re-rendered this node — leave it alone
          const k = Math.floor(p * o.orig.length);
          const v = p >= 1 ? o.orig : [...o.orig].map((ch, i) => (i < k || ch === ' ' ? ch : NOISE[(i * 13 + Math.floor(t / 40)) % NOISE.length])).join('');
          o.n.nodeValue = v; o.last = v;
        }
        if (p < 1) requestAnimationFrame(step); else busy.delete(btn);
      };
      requestAnimationFrame(step);
    };

    const onOver = (e: PointerEvent) => {
      const b = btnOf(e.target);
      if (!b || b.contains(e.relatedTarget as Node | null)) return;
      if (fine) scramble(b);
    };
    const onMove = (e: PointerEvent) => {
      if (!fine) return;
      const b = btnOf(e.target);
      if (!b) return;
      const r = b.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / r.width, dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      b.style.setProperty('--mx', (dx * 10).toFixed(1) + 'px');
      b.style.setProperty('--my', (dy * 8).toFixed(1) + 'px');
      b.style.setProperty('--hx', ((dx + 0.5) * 100).toFixed(0) + '%');
    };
    const onOut = (e: PointerEvent) => {
      const b = btnOf(e.target);
      if (!b || b.contains(e.relatedTarget as Node | null)) return;
      b.style.removeProperty('--mx'); b.style.removeProperty('--my');
    };
    const onDown = (e: PointerEvent) => {
      const b = btnOf(e.target);
      if (!b || (b as HTMLButtonElement).disabled) return;
      const r = b.getBoundingClientRect();
      const s = document.createElement('span');
      s.className = 'btn-burst';
      s.style.left = e.clientX - r.left + 'px';
      s.style.top = e.clientY - r.top + 'px';
      b.appendChild(s);
      b.classList.remove('btn-kick'); void b.offsetWidth; b.classList.add('btn-kick');
      window.setTimeout(() => { s.remove(); b.classList.remove('btn-kick'); }, 620);
    };

    document.addEventListener('pointerover', onOver);
    document.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerout', onOut);
    document.addEventListener('pointerdown', onDown, { passive: true });
    return () => {
      document.removeEventListener('pointerover', onOver);
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerout', onOut);
      document.removeEventListener('pointerdown', onDown);
    };
  }, []);
  return null;
}
