'use client';
import { useAudioPlayer } from '@/lib/useAudioPlayer';

function fmtTime(v: number): string {
  if (!isFinite(v)) return '0:00';
  return `${(v / 60) | 0}:${String((v | 0) % 60).padStart(2, '0')}`;
}

export function AudioBar() {
  const { title, playing, t, d, toggle, seek } = useAudioPlayer();
  const pct = d > 0 ? Math.min(100, (t / d) * 100) : 0;
  const pctStr = pct.toFixed(2) + '%';
  return (
    <div className="audio-bar" style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 60, background: 'rgba(11,11,13,.94)', borderTop: '1px solid #26262B', backdropFilter: 'blur(10px)', padding: '10px clamp(10px,3vw,20px) calc(10px + env(safe-area-inset-bottom,0px))', display: 'flex', alignItems: 'center', gap: 'clamp(6px,2vw,14px)' }}>
      <button onClick={toggle} aria-label="play" style={{ width: 38, height: 38, flex: 'none', background: '#E5372C', border: 'none', color: '#0D0D0F', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'JetBrains Mono',monospace" }}>{playing ? '❚❚' : '▶'}</button>
      <div className="track-info" style={{ minWidth: 0, flex: 'none', width: 'clamp(100px,28vw,230px)' }}>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '.26em', color: '#55545C' }}>GTR PHT · SOUNDTRACK</div>
        <div style={{ fontFamily: "'Unbounded',sans-serif", fontWeight: 700, fontSize: 12, color: '#ECE9E4', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
      </div>
      <div onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); seek((e.clientX - r.left) / r.width); }} style={{ flex: 1, height: 26, display: 'flex', alignItems: 'center', cursor: 'pointer', minWidth: 60 }}>
        <div style={{ position: 'relative', width: '100%', height: 3, background: '#26262B' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: pctStr, background: '#E5372C' }} />
          <div style={{ position: 'absolute', top: -3, left: pctStr, width: 9, height: 9, marginLeft: -4, background: '#ECE9E4', borderRadius: '50%' }} />
        </div>
      </div>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '.08em', color: '#8E8C94', flex: 'none' }}>{fmtTime(t)} / {fmtTime(d)}</div>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '.2em', color: '#3E3E46', flex: 'none' }}>{playing ? '▮▯▮ ON AIR' : 'STANDBY'}</div>
    </div>
  );
}
