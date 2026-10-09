'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useHub } from '@/lib/HubContext';

const LINES = ['REALITY LAYER — 07', 'CONSCIOUSNESS GRID', 'ROUTE ENGINE · TH-001', 'STREAM UPLINK ×6', 'TELEMETRY LINK', 'WORLD ENGINE'];

export function Boot() {
  const { t } = useHub();
  const [visible, setVisible] = useState(true);
  const [op, setOp] = useState(1);
  const [p, setP] = useState(0);
  const doneRef = useRef(false);
  const hidingRef = useRef(false);

  const finish = () => {
    if (hidingRef.current) return;
    hidingRef.current = true;
    doneRef.current = true;
    setOp(0);
    setP(100);
    setTimeout(() => setVisible(false), 520);
  };

  useEffect(() => {
    const t0 = performance.now();
    const dur = 2700;
    let raf = 0;
    const step = (tm: number) => {
      if (doneRef.current) return;
      const pct = Math.min(100, Math.round(((tm - t0) / dur) * 100));
      setP(pct);
      if (pct >= 100) finish();
      else raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  const bootLines = useMemo(() => LINES.map((txt, idx) => ({ txt, o: p > (idx + 1) * 13 ? 1 : 0.12 })), [p]);
  if (!visible) return null;

  return (
    <div className="boot-card" onClick={finish} style={{ position: 'fixed', inset: 0, zIndex: 2000, background: '#070708', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: op, transition: 'opacity .5s ease' }}>
      <div style={{ width: 'min(540px,86vw)' }}>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '.3em', color: '#E5372C' }}>GTR|PHT PROTOCOL v26.08</div>
        <div style={{ fontFamily: "'Inter Tight',sans-serif", fontWeight: 900, fontSize: 'clamp(34px,6vw,52px)', letterSpacing: '.02em', color: '#ECE9E4', marginTop: 14, animation: 'omGlitch 2.6s infinite' }}>
          GTR<span style={{ color: '#E5372C' }}>|</span>PHT
        </div>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, letterSpacing: '.22em', color: '#8E8C94', marginTop: 10 }}>{t.bootInit}</div>
        <div style={{ marginTop: 26, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {bootLines.map((b, i) => (
            <div key={i} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, letterSpacing: '.12em', color: '#6E6C74', opacity: b.o, transition: 'opacity .3s' }}>{b.txt}</div>
          ))}
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, letterSpacing: '.12em', color: '#E5372C', minHeight: 14 }}>{p >= 95 ? '... ACTIVATED' : ''}</div>
        </div>
        <div style={{ marginTop: 22, border: '1px solid #2A2A30', padding: 3, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 8, background: '#141416', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: p + '%', background: '#E5372C', boxShadow: '0 0 14px rgba(229,55,44,.9)' }} />
          </div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: '#FF4B3E', minWidth: 42, textAlign: 'right', paddingRight: 4 }}>{p}%</div>
        </div>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, letterSpacing: '.2em', color: '#4A4950', marginTop: 16, textAlign: 'center' }}>{t.bootSkip}</div>
      </div>
    </div>
  );
}
