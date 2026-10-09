import { ls } from './storage';
import { WAY, cumKm, latLngToParam, paramToLatLng, routeParam, names, ResolvedPos } from './route';
import { Dict, STAGE_DEFS } from './i18n';
import type { Lang } from './useLang';

export const START_MS = Date.parse('2026-08-01T09:00:00+07:00');
export const END_MS = Date.parse('2026-09-08T21:00:00+07:00');
const DAY0_MS = Date.parse('2026-08-01T00:00:00+07:00');

interface RawPos { lat: number; lng: number; ts: number; by?: string; src?: string }

export function resolvePos(now: number): ResolvedPos {
  const real = ls<RawPos | null>('gtrpht_pos', null);
  if (real && isFinite(+real.lat) && isFinite(+real.lng) && Date.now() - (+real.ts || 0) < 3 * 86400000) {
    return {
      lat: +real.lat, lng: +real.lng,
      p: latLngToParam(+real.lat, +real.lng),
      src: 'gps', by: (real.by || '').toString().toUpperCase(), ts: +real.ts || Date.now(),
    };
  }
  const p = routeParam(now);
  const [lat, lng] = paramToLatLng(p);
  return { lat, lng, p, src: 'plan', by: '', ts: now };
}

export interface StageView {
  n: string; title: string; dates: string; base: string; leg: string;
  status: string; bc: string; shadow: string; nCol: string; chipCol: string; chipBc: string;
}

export interface CrewStatusRecord { code: 'drive' | 'base' | 'ferry' | 'live' | 'stop'; ts: number; by?: string }

export interface Journey {
  isCountdown: boolean; isJourney: boolean; isDone: boolean;
  cd: { d: string; h: string; m: string; s: string };
  day: number; km: number; pos: ResolvedPos;
  posLabel: string; posCoords: string; ageTxt: string; srcGps: boolean;
  routePct: number;
  stages: StageView[]; curStage: string; stageNo: string; stagePct: number;
  crewStatus: string; crewStatusAge: string;
  nextPoint: string; ictTime: string;
}

export function deriveJourney(now: number, lang: Lang, t: Dict): Journey {
  const ru = lang === 'ru';
  const isCountdown = now < START_MS;
  const isDone = now > END_MS;
  const isJourney = !isCountdown;
  const diff = Math.max(0, START_MS - now);
  const pad = (n: number) => String(n).padStart(2, '0');
  const cd = {
    d: String(Math.floor(diff / 86400000)),
    h: pad(Math.floor(diff / 3600000) % 24),
    m: pad(Math.floor(diff / 60000) % 60),
    s: pad(Math.floor(diff / 1000) % 60),
  };
  const day = isCountdown ? 0 : Math.min(39, Math.floor((now - DAY0_MS) / 86400000) + 1);
  const pos = resolvePos(now);
  const p = isDone && pos.src !== 'gps' ? 10 : pos.p;
  const cum = cumKm();
  const i = Math.min(9, Math.floor(p));
  const f = Math.min(1, p - i);
  const km = Math.round(cum[i] + f * (cum[i + 1] - cum[i]));
  const NAMES = names(ru);

  let posLabel: string;
  if (pos.src === 'gps') posLabel = 'LIVE · ' + (NAMES[Math.round(p)] || NAMES[10]);
  else if (isCountdown) posLabel = NAMES[0] + ' · ' + t.posWait;
  else if (isDone) posLabel = NAMES[10] + ' · FINISH';
  else if (f < 0.04 || f > 0.96) posLabel = NAMES[Math.round(p)] || NAMES[10];
  else posLabel = (NAMES[i] || NAMES[1]) + ' → ' + (NAMES[i + 1] || NAMES[1]);

  const ageMin = Math.round((Date.now() - pos.ts) / 60000);
  const ageTxt = ageMin < 1 ? (ru ? 'только что' : 'just now') : ageMin < 90 ? ageMin + ' ' + t.minAgo : Math.round(ageMin / 60) + ' ' + t.hrAgo;
  const srcGps = pos.src === 'gps';

  let curStage = '', stageNo = '01', stagePct = 0;
  const stages: StageView[] = STAGE_DEFS.map((sd) => {
    const L = ru ? sd.ru : sd.en;
    const s1 = Date.parse(sd.s + 'T09:00:00+07:00');
    const e1 = Date.parse(sd.e + 'T12:00:00+07:00');
    const st = now >= e1 ? 'done' : now >= s1 ? 'active' : 'wait';
    if (st === 'active') {
      curStage = L[0];
      stageNo = sd.n;
      stagePct = Math.round(((now - s1) / (e1 - s1)) * 100);
    }
    return {
      n: sd.n, title: L[0], dates: L[1], base: L[2], leg: L[3],
      status: st === 'done' ? t.stDone : st === 'active' ? t.stActive : t.stWait,
      bc: st === 'active' ? '#E5372C' : '#26262B',
      shadow: st === 'active' ? '0 0 30px rgba(229,55,44,.14)' : 'none',
      nCol: st === 'active' ? '#FF4B3E' : st === 'done' ? '#55545C' : '#3F3F45',
      chipCol: st === 'active' ? '#FF6A5B' : st === 'done' ? '#8E8C94' : '#6E6C74',
      chipBc: st === 'active' ? '#E5372C' : '#2A2A30',
    };
  });
  if (!curStage) {
    curStage = isDone ? (ru ? 'Бангкок — финиш' : 'Bangkok — finish') : ru ? 'Пхукет — точка входа' : 'Phuket — entry point';
    if (isDone) { stageNo = '07'; stagePct = 100; }
  }

  const stRec = ls<CrewStatusRecord | null>('gtrpht_status', null);
  let crewStatus = t.statusPlan, crewStatusAge = '';
  if (stRec && t.statuses[stRec.code]) {
    crewStatus = t.statuses[stRec.code];
    const m2 = Math.round((Date.now() - (+stRec.ts || 0)) / 60000);
    crewStatusAge = '· ' + (m2 < 1 ? (ru ? 'только что' : 'just now') : m2 < 90 ? m2 + ' ' + t.minAgo : Math.round(m2 / 60) + ' ' + t.hrAgo) + (stRec.by ? ' · ' + String(stRec.by).toUpperCase() : '');
  }

  const MS = [1, 2, 3, 5, 6, 7, 8, 9, 10];
  let nxt: number | null = null;
  for (const mIdx of MS) {
    if (p < mIdx - 0.02) { nxt = mIdx; break; }
  }
  const nextPoint = nxt == null ? t.finishWord : NAMES[nxt] + ' · ~' + Math.max(0, cum[nxt] - km) + ' ' + t.kmUnit;

  const ictTime = new Date(now).toLocaleTimeString(ru ? 'ru-RU' : 'en-GB', {
    timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  return {
    isCountdown, isJourney, isDone, cd, day, km, pos,
    posLabel, posCoords: pos.lat.toFixed(4) + ', ' + pos.lng.toFixed(4) + ' · ' + ageTxt, ageTxt, srcGps,
    routePct: Math.round((km / 2830) * 100),
    stages, curStage, stageNo, stagePct: Math.max(0, Math.min(100, stagePct)),
    crewStatus, crewStatusAge, nextPoint, ictTime,
  };
}

export { WAY };
