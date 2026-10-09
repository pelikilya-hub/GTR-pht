'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

// The design's soundtrack first; if that file is not deployed, a bundled synthwave loop
// (public/assets/audio/night-drive.mp3) keeps the player and the beat-sync visuals alive.
const TRACKS = [
  { title: 'MIDNIGHT CIRCUIT', src: '/assets/audio/midnight-circuit.mp3' },
  { title: 'NIGHT DRIVE', src: '/assets/audio/night-drive.mp3' },
];

declare global {
  interface Window {
    __gtrBeat?: number;
  }
}

// Single soundtrack player + bass analyser feeding window.__gtrBeat (0..1),
// read by the gtr-deity / gtr-matrix-photo canvas layers for beat-sync glow.
export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const acRef = useRef<AudioContext | null>(null);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const [d, setD] = useState(0);
  const [title, setTitle] = useState(TRACKS[0].title);

  useEffect(() => {
    let ti = 0;
    const a = new Audio(TRACKS[0].src);
    audioRef.current = a;
    a.preload = 'auto';
    a.loop = true;
    try {
      const p = +(localStorage.getItem('gtrpht_track_pos') || '0');
      if (isFinite(p) && p > 0) a.currentTime = p;
    } catch {
      /* ignore */
    }
    let lastSave = 0;
    const onTime = () => {
      setT(a.currentTime);
      setD(a.duration || 0);
      if (!lastSave || Date.now() - lastSave > 2000) {
        lastSave = Date.now();
        try {
          localStorage.setItem('gtrpht_track_pos', String(a.currentTime));
        } catch {
          /* ignore */
        }
      }
    };
    const onMeta = () => setD(a.duration || 0);
    const onPlay = () => {
      setPlaying(true);
      wireBeat();
    };
    const onPause = () => setPlaying(false);
    const onError = () => {
      if (ti >= TRACKS.length - 1) return;
      ti += 1;
      const wasPlaying = !a.paused;
      a.src = TRACKS[ti].src;
      setTitle(TRACKS[ti].title);
      try { localStorage.removeItem('gtrpht_track_pos'); } catch { /* ignore */ }
      a.load();
      if (wasPlaying || playRequested) a.play().catch(() => {});
    };
    let playRequested = false;
    a.addEventListener('error', onError);
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('play', onPlay);
    a.addEventListener('pause', onPause);

    const kick = () => {
      playRequested = true;
      if (a.paused) a.play().catch(() => {});
      window.removeEventListener('pointerdown', kick);
    };
    window.addEventListener('pointerdown', kick);

    function wireBeat() {
      if (acRef.current) {
        if (acRef.current.state === 'suspended') acRef.current.resume();
        return;
      }
      try {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AC) return;
        const ac = new AC();
        acRef.current = ac;
        const src = ac.createMediaElementSource(a);
        const an = ac.createAnalyser();
        an.fftSize = 256;
        an.smoothingTimeConstant = 0.6;
        src.connect(an);
        an.connect(ac.destination);
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
      } catch {
        /* AudioContext unavailable — beat-sync simply stays off */
      }
    }

    return () => {
      a.pause();
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('loadedmetadata', onMeta);
      a.removeEventListener('play', onPlay);
      a.removeEventListener('pause', onPause);
      a.removeEventListener('error', onError);
      window.removeEventListener('pointerdown', kick);
    };
  }, []);

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => {});
    else a.pause();
  }, []);

  const seek = useCallback(
    (ratio: number) => {
      const a = audioRef.current;
      if (!a || !d) return;
      a.currentTime = Math.max(0, Math.min(1, ratio)) * d;
    },
    [d],
  );

  return { title, playing, t, d, toggle, seek };
}
