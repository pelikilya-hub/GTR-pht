'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { gridFor, type Grid } from './beatmap';

export interface Track { title: string; src: string }
// Used only if tracks.json is missing (it is generated at build time from public/assets/audio).
const DEFAULT_TRACKS: Track[] = [{ title: 'NIGHT DRIVE', src: '/assets/audio/night-drive.mp3' }];
const POS_LS = 'gtrpht_track_pos';
const IDX_LS = 'gtrpht_track_idx';

declare global {
  interface Window { __gtrBeat?: number; __gtrAudio?: HTMLAudioElement; __gtrGrid?: Grid | null }
}

/** Playlist player + bass analyser feeding window.__gtrBeat (0..1) for the beat-synced canvases. */
export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const acRef = useRef<AudioContext | null>(null);
  const tracksRef = useRef<Track[]>(DEFAULT_TRACKS);
  const idxRef = useRef(0);
  const wantPlay = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const [d, setD] = useState(0);
  const [idx, setIdx] = useState(0);
  const [tracks, setTracks] = useState<Track[]>(DEFAULT_TRACKS);

  const load = useCallback((i: number, autoplay: boolean) => {
    const a = audioRef.current, list = tracksRef.current;
    if (!a || !list.length) return;
    const n = ((i % list.length) + list.length) % list.length;
    idxRef.current = n;
    setIdx(n);
    a.src = list[n].src;
    window.__gtrGrid = gridFor(list[n].src);
    a.loop = list.length === 1;
    a.load();
    try { localStorage.setItem(IDX_LS, String(n)); localStorage.removeItem(POS_LS); } catch { /* ignore */ }
    if (autoplay) a.play().catch(() => {});
  }, []);

  useEffect(() => {
    const a = new Audio();
    audioRef.current = a;
    window.__gtrAudio = a;
    a.preload = 'metadata';
    let alive = true;

    fetch('/assets/audio/tracks.json', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((list: Track[] | null) => {
        if (!alive) return;
        if (Array.isArray(list) && list.length) { tracksRef.current = list; setTracks(list); }
        let i = 0, pos = 0;
        try { i = +(localStorage.getItem(IDX_LS) || 0); pos = +(localStorage.getItem(POS_LS) || 0); } catch { /* ignore */ }
        load(isFinite(i) ? i : 0, wantPlay.current);
        if (pos > 0 && isFinite(pos)) a.addEventListener('loadedmetadata', () => { try { a.currentTime = pos; } catch { /* ignore */ } }, { once: true });
      });

    let lastSave = 0;
    const onTime = () => {
      setT(a.currentTime); setD(a.duration || 0);
      if (Date.now() - lastSave > 2000) { lastSave = Date.now(); try { localStorage.setItem(POS_LS, String(a.currentTime)); } catch { /* ignore */ } }
    };
    const onMeta = () => setD(a.duration || 0);
    const onPlay = () => { setPlaying(true); wireBeat(); };
    const onPause = () => setPlaying(false);
    const onEnded = () => { if (tracksRef.current.length > 1) load(idxRef.current + 1, true); };
    const onError = () => { if (tracksRef.current.length > 1) load(idxRef.current + 1, wantPlay.current); };
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('play', onPlay);
    a.addEventListener('pause', onPause);
    a.addEventListener('ended', onEnded);
    a.addEventListener('error', onError);

    // Browsers block autoplay with sound: start on the first tap anywhere.
    const kick = (e: Event) => {
      if ((e.target as HTMLElement | null)?.closest?.('[data-audio-ui]')) return;
      wantPlay.current = true;
      if (a.paused && a.src) a.play().catch(() => {});
      window.removeEventListener('pointerdown', kick);
    };
    window.addEventListener('pointerdown', kick);

    function wireBeat() {
      if (acRef.current) { if (acRef.current.state === 'suspended') acRef.current.resume(); return; }
      try {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AC) return;
        const ac = new AC();
        acRef.current = ac;
        const src = ac.createMediaElementSource(a);
        const an = ac.createAnalyser();
        an.fftSize = 256; an.smoothingTimeConstant = 0.6;
        src.connect(an); an.connect(ac.destination);
        const buf = new Uint8Array(an.frequencyBinCount);
        let env = 0;
        const tick = () => {
          requestAnimationFrame(tick);
          an.getByteFrequencyData(buf);
          let bass = 0;
          for (let i = 1; i < 9; i++) bass += buf[i];
          bass /= 8 * 255;
          env = Math.max(bass, env * 0.9);
          window.__gtrBeat = !a.paused ? env : 0;
        };
        tick();
      } catch { /* no AudioContext → beat-sync stays off */ }
    }

    return () => {
      alive = false;
      a.pause();
      if (window.__gtrAudio === a) delete window.__gtrAudio;
      a.removeEventListener('timeupdate', onTime); a.removeEventListener('loadedmetadata', onMeta);
      a.removeEventListener('play', onPlay); a.removeEventListener('pause', onPause);
      a.removeEventListener('ended', onEnded); a.removeEventListener('error', onError);
      window.removeEventListener('pointerdown', kick);
    };
  }, [load]);

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    wantPlay.current = true;
    if (a.paused) a.play().catch(() => {}); else { wantPlay.current = false; a.pause(); }
  }, []);
  const next = useCallback(() => load(idxRef.current + 1, true), [load]);
  const prev = useCallback(() => {
    const a = audioRef.current;
    if (a && a.currentTime > 4) { a.currentTime = 0; return; }
    load(idxRef.current - 1, true);
  }, [load]);
  const seek = useCallback((ratio: number) => {
    const a = audioRef.current;
    if (!a || !d) return;
    a.currentTime = Math.max(0, Math.min(1, ratio)) * d;
  }, [d]);

  return { title: tracks[idx]?.title || '', count: tracks.length, idx, playing, t, d, toggle, seek, next, prev };
}
