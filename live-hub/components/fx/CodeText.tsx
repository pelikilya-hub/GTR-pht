'use client';
import { useEffect, useRef, useState } from 'react';
import { sfx } from '@/lib/sfx';

const NOISE = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&@$/\\<>{}[]=+*ЖЩЫЮЯФДЛБ';

/**
 * Text that decodes out of glyph noise when it scrolls into view (GTR "проявление кодом").
 * Words alternate white / red (`alt`), or only the last word is red (`accent="last"`).
 */
export function CodeText({ text, as: Tag = 'span', className, alt = true, accent, speed = 1, style }: {
  text: string; as?: 'span' | 'h1' | 'h2' | 'div'; className?: string; alt?: boolean; accent?: 'last' | 'none'; speed?: number; style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [k, setK] = useState(0); // number of resolved characters
  const [tick, setTick] = useState(0);
  const started = useRef(false);
  const total = text.length;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { const r = requestAnimationFrame(() => setK(total)); return () => cancelAnimationFrame(r); }
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || started.current) return;
      started.current = true;
      const t0 = performance.now(), dur = (420 + total * 28) / speed;
      const step = (t: number) => {
        const p = Math.min(1, (t - t0) / dur);
        setK(Math.floor(p * total));
        setTick((x) => x + 1);
        if (Math.random() < 0.35) sfx('decode');
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [total, speed]);

  const words = text.split(/(\s+)/);
  const starts: number[] = [];
  const wordNo: number[] = [];
  for (let i = 0, pos = 0, n = 0; i < words.length; i++) { starts.push(pos); wordNo.push(words[i].trim() ? n++ : -1); pos += words[i].length; }
  const lastWord = Math.max(...wordNo);
  const frame = tick;
  const out = words.map((w, i) => {
    if (!w.trim()) return <span key={i}>{w}</span>;
    const wi = wordNo[i], start = starts[i];
    const red = accent === 'last' ? wi === lastWord : accent === 'none' ? false : alt && wi % 2 === 1;
    const chars = [...w].map((ch, j) => {
      const pos = start + j;
      if (pos < k) return ch;
      if (pos > k + 6) return NOISE[(pos * 7 + frame) % NOISE.length];
      return NOISE[(pos * 31 + frame * 17) % NOISE.length];
    }).join('');
    const resolved = start + w.length <= k;
    return <span key={i} className={'ct-w' + (red ? ' ct-red' : '') + (resolved ? ' ct-done' : '')}>{chars}</span>;
  });
  const Comp = Tag as 'span';
  return <Comp ref={ref as React.Ref<HTMLSpanElement>} className={className} style={style} aria-label={text}>{out}</Comp>;
}
