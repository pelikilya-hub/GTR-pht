/**
 * Beat grids of the playlist tracks, measured offline (tempo + first downbeat, seconds). Keyed by file name.
 * A new track without an entry still plays; the hero reel then cuts on its own clock.
 */
export interface Grid { bpm: number; offset: number }
export const BEATMAP: Record<string, Grid> = {
  '01-gtr-phuket-bangtao-style.mp3': { bpm: 88, offset: 0.685 },
  '02-frozen-shadows.mp3': { bpm: 135, offset: 0.029 },
  '03-midnight-circuit.mp3': { bpm: 142, offset: 0.032 },
  '04-longlost-i-hate-everything-about-you.mp3': { bpm: 85, offset: 2.839 },
  '05-concrete-heartbeat.mp3': { bpm: 122, offset: 1.724 },
  '06-bang-tao-style.mp3': { bpm: 87.44, offset: 1.683 },
  '07-tin-moonshine.mp3': { bpm: 139.86, offset: 1.737 },
  '08-untitled.mp3': { bpm: 86, offset: 0.356 },
};
export const gridFor = (src: string): Grid | null => BEATMAP[decodeURIComponent(src.split('/').pop() || '')] || null;
