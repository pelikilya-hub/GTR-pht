'use client';
import { useAudioPlayer } from '@/lib/useAudioPlayer';
import { useHub } from '@/lib/HubContext';

const fmt = (v: number) => (isFinite(v) ? `${(v / 60) | 0}:${String((v | 0) % 60).padStart(2, '0')}` : '0:00');

export function AudioBar() {
  const ru = useHub().lang === 'ru';
  const { title, count, idx, status, playing, t, d, toggle, seek, next, prev } = useAudioPlayer();
  const pct = d > 0 ? Math.min(100, (t / d) * 100) : 0;
  return (
    <div className={'glass audio' + (playing ? '' : ' paused') + (status === 'loading' ? ' loading' : '') + (status === 'error' ? ' error' : '')} data-audio-ui>
      <button className="play" onClick={toggle} aria-label={status === 'error' ? 'retry' : playing ? 'pause' : 'play'}>
        {status === 'error'
          ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 7a5 5 0 1 1-1.5-3.6M12 1.5V5H8.5" /></svg>
          : playing
          ? <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="2" y="1" width="3.5" height="12" rx="1" /><rect x="8.5" y="1" width="3.5" height="12" rx="1" /></svg>
          : <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M3 1.5v11l9.5-5.5z" /></svg>}
      </button>
      {count > 1 && <button className="skip" onClick={prev} aria-label="previous">⏮</button>}
      <div className="eq" aria-hidden><i /><i /><i /><i /></div>
      <div style={{ minWidth: 0, flex: '0 1 200px' }}>
        <div className="meta meta-t" style={{ fontSize: 9 }}>{status === 'error' ? (ru ? 'НЕТ СВЯЗИ · НАЖМИ ↻' : 'NO SIGNAL · TAP ↻') : status === 'loading' ? (ru ? 'ЗАГРУЗКА…' : 'LOADING…') : 'BANGTAOSTYLE.COM · SOUNDTRACK'}{count > 1 ? ` · ${idx + 1}/${count}` : ''}</div>
        <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
      </div>
      <div role="slider" tabIndex={0} aria-label="position" aria-valuemin={0} aria-valuemax={Math.round(d)} aria-valuenow={Math.round(t)}
        onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); seek((e.clientX - r.left) / r.width); }}
        onKeyDown={(e) => { if (d && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) seek((t + (e.key === 'ArrowRight' ? 10 : -10)) / d); }}
        style={{ flex: 1, height: 28, display: 'flex', alignItems: 'center', cursor: 'pointer', minWidth: 40 }}>
        <div className="bar" style={{ width: '100%', height: 3 }}><i style={{ width: pct + '%', transition: 'none' }} /></div>
      </div>
      <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', flex: 'none' }}>{fmt(t)}<span className="meta-t"> / {fmt(d)}</span></span>
      {count > 1 && <button className="skip" onClick={next} aria-label="next">⏭</button>}
    </div>
  );
}
