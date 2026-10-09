'use client';
import { useEffect, useRef, useState } from 'react';

/** Adds `.in` to every `.rv`, `.rv-l`, `.split-line` that scrolls into view (also ones mounted later). */
export function RevealObserver() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }),
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    const scan = () => document.querySelectorAll('.rv:not(.in), .rv-l:not(.in), .split-line:not(.in)').forEach((el) => io.observe(el));
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); };
  }, []);
  return null;
}

/** Number that counts up once it scrolls into view. */
export function Count({ to, locale = 'ru-RU', dur = 1600 }: { to: number; locale?: string; dur?: number }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [v, setV] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || started.current) return;
      started.current = true;
      if (reduce) { setV(to); return; }
      const t0 = performance.now();
      const step = (t: number) => {
        const k = Math.min(1, (t - t0) / dur);
        setV(Math.round(to * (1 - Math.pow(1 - k, 4))));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [to, dur]);
  useEffect(() => { if (started.current) setV(to); }, [to]);
  return <span ref={ref}>{v.toLocaleString(locale)}</span>;
}

/** Headline whose lines slide up from a mask. */
export function SplitTitle({ lines, className, as: Tag = 'h2' }: { lines: React.ReactNode[]; className?: string; as?: 'h1' | 'h2' }) {
  return (
    <Tag className={className}>
      {lines.map((l, i) => (
        <span key={i} className="split-line"><span style={{ ['--d' as string]: `${i * 0.09}s` }}>{l}</span></span>
      ))}
    </Tag>
  );
}

export function SectionHead({ kicker, title, lead, right, id }: { kicker: string; title: React.ReactNode; lead?: React.ReactNode; right?: React.ReactNode; id?: string }) {
  return (
    <div className="sec-head" id={id}>
      <div>
        <div className="kicker rv">{kicker}</div>
        <SplitTitle className="h2" lines={[title]} />
        {lead ? <p className="lead rv" style={{ ['--d' as string]: '.1s' }}>{lead}</p> : null}
      </div>
      {right ? <div className="rv" style={{ ['--d' as string]: '.15s' }}>{right}</div> : null}
    </div>
  );
}
