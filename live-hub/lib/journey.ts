import { ls } from './storage';
import {
  STOPS, LEGS, TOTAL_KM, END_MS, DAY_MS, buildSchedule, plannedP, stageSpans, pToLatLng, latLngToP, kmAt,
} from './tour';
import type { Dict } from './i18n';
import type { Lang } from './useLang';

export { END_MS };

export interface ResolvedPos { lat: number; lng: number; p: number; src: 'gps' | 'plan'; by: string; ts: number }
interface RawPos { lat: number; lng: number; ts: number; by?: string }
export interface TourConfig { start?: string | null }
export interface CrewStatusRecord { code: 'drive' | 'base' | 'ferry' | 'live' | 'stop'; ts: number; by?: string }

export type PhaseName = 'soon' | 'countdown' | 'live' | 'done';

export interface StageView {
  n: string; title: string; dates: string; base: string; leg: string;
  state: 'done' | 'active' | 'wait'; status: string; pct: number;
}

export interface Journey {
  phase: PhaseName;
  isCountdown: boolean; isJourney: boolean; isDone: boolean; isSoon: boolean;
  startMs: number | null; endMs: number; totalDays: number;
  cd: { d: string; h: string; m: string; s: string };
  day: number; km: number; totalKm: number; ferries: number; stopsCount: number;
  pos: ResolvedPos; posLabel: string; posCoords: string; ageTxt: string; srcGps: boolean;
  routePct: number;
  stages: StageView[]; curStage: string; stageNo: string; stagePct: number;
  crewStatus: string; crewStatusAge: string; nextPoint: string; ictTime: string;
  startLabel: string; datesLabel: string;
}

export function tourStart(): number | null {
  const cfg = ls<TourConfig>('gtrpht_tour', {});
  const ms = cfg.start ? Date.parse(cfg.start) : NaN;
  return isFinite(ms) ? ms : null;
}

const pad = (n: number) => String(n).padStart(2, '0');
function fmtDate(ms: number, ru: boolean, withYear = false): string {
  return new Date(ms).toLocaleDateString(ru ? 'ru-RU' : 'en-GB', {
    timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}),
  }).replace('.', '');
}
function fmtRange(s: number, e: number, ru: boolean): string {
  const a = fmtDate(s, ru), b = fmtDate(e - 1, ru);
  return a === b ? a : a + ' – ' + b;
}

const STOP_NOTES: Record<string, [string, string]> = {
  phuket: ['старт · виллы GTR Realty', 'start · GTR Realty villas'],
  samui: ['виллы над заливом · охота за тачками', 'villas over the gulf · car hunt'],
  phangan: ['ночь без сценария', 'an unscripted night'],
  chiangmai: ['храмы, горы, мастерские', 'temples, mountains, workshops'],
  ayutthaya: ['руины · вечер трансформации', 'ruins · transformation evening'],
  bangkok: ['студия · рынки запчастей', 'studio · parts markets'],
  pattaya: ['тачки, ночь, море', 'cars, nights, the sea'],
  'phuket-final': ['финал · церемония блага', 'finale · the good ceremony'],
};

export function deriveJourney(now: number, lang: Lang, t: Dict): Journey {
  const ru = lang === 'ru';
  const startMs = tourStart();
  const endMs = END_MS;
  const phase: PhaseName = startMs == null ? 'soon' : now < startMs ? 'countdown' : now > endMs ? 'done' : 'live';
  const sched = startMs != null ? buildSchedule(startMs, endMs) : [];
  const totalDays = startMs != null ? Math.max(1, Math.ceil((endMs - startMs) / DAY_MS)) : 0;

  const diff = startMs != null ? Math.max(0, startMs - now) : 0;
  const cd = {
    d: String(Math.floor(diff / DAY_MS)), h: pad(Math.floor(diff / 3600000) % 24),
    m: pad(Math.floor(diff / 60000) % 60), s: pad(Math.floor(diff / 1000) % 60),
  };
  const day = phase === 'live' && startMs != null ? Math.min(totalDays, Math.floor((now - startMs) / DAY_MS) + 1) : phase === 'done' ? totalDays : 0;

  // position: fresh crew GPS (< 3 days) wins, else the schedule estimate
  const planP = phase === 'live' ? plannedP(now, sched) : phase === 'done' ? LEGS.length : 0;
  const raw = ls<RawPos | null>('gtrpht_pos', null);
  let pos: ResolvedPos;
  if (raw && isFinite(+raw.lat) && isFinite(+raw.lng) && Date.now() - (+raw.ts || 0) < 3 * DAY_MS && phase !== 'soon') {
    pos = { lat: +raw.lat, lng: +raw.lng, p: latLngToP(+raw.lat, +raw.lng, planP), src: 'gps', by: String(raw.by || '').toUpperCase(), ts: +raw.ts || Date.now() };
  } else {
    const [lat, lng] = pToLatLng(planP);
    pos = { lat, lng, p: planP, src: 'plan', by: '', ts: now };
  }
  const p = pos.p;
  const km = kmAt(p);
  const name = (i: number) => (ru ? STOPS[i]?.ru : STOPS[i]?.en) || '';
  const i = Math.min(LEGS.length - 1, Math.floor(p));
  const f = p - Math.floor(p);

  let posLabel: string;
  if (phase === 'soon' || phase === 'countdown') posLabel = name(0) + ' · ' + t.posWait;
  else if (phase === 'done' && pos.src !== 'gps') posLabel = name(STOPS.length - 1);
  else if (f < 0.02 || p >= LEGS.length) posLabel = (pos.src === 'gps' ? 'LIVE · ' : '') + name(Math.round(p));
  else posLabel = (pos.src === 'gps' ? 'LIVE · ' : '') + name(i) + ' → ' + name(i + 1);

  const ageMin = Math.round((Date.now() - pos.ts) / 60000);
  const ageTxt = ageMin < 1 ? (ru ? 'только что' : 'just now') : ageMin < 90 ? ageMin + ' ' + t.minAgo : Math.round(ageMin / 60) + ' ' + t.hrAgo;

  const spans = stageSpans(sched);
  let curStage = '', stageNo = '01', stagePct = 0;
  const stages: StageView[] = STOPS.map((st, k) => {
    const sp = spans[k];
    const state: StageView['state'] = phase === 'done' ? 'done' : phase !== 'live' ? 'wait' : now >= sp.e ? 'done' : now >= sp.s ? 'active' : 'wait';
    const pct = state === 'done' ? 100 : state === 'active' ? Math.round(((now - sp.s) / Math.max(1, sp.e - sp.s)) * 100) : 0;
    const n = pad(k + 1);
    if (state === 'active') { curStage = name(k); stageNo = n; stagePct = pct; }
    const note = STOP_NOTES[st.id] || ['', ''];
    return {
      n, title: name(k),
      dates: startMs != null ? fmtRange(sp.s, sp.e, ru) : (ru ? 'даты после старта' : 'dates after start'),
      base: ru ? note[0] : note[1],
      leg: ru ? sp.legRu : sp.legEn,
      state, pct,
      status: state === 'done' ? t.stDone : state === 'active' ? t.stActive : t.stWait,
    };
  });
  if (!curStage) {
    if (phase === 'done') { curStage = name(STOPS.length - 1); stageNo = pad(STOPS.length); stagePct = 100; }
    else curStage = ru ? 'Пхукет — точка входа' : 'Phuket — entry point';
  }

  const stRec = ls<CrewStatusRecord | null>('gtrpht_status', null);
  let crewStatus = phase === 'live' ? t.statusPlan : phase === 'done' ? t.statusDone : t.statusSoon;
  let crewStatusAge = '';
  if (stRec && t.statuses[stRec.code] && phase !== 'soon') {
    crewStatus = t.statuses[stRec.code];
    const m2 = Math.round((Date.now() - (+stRec.ts || 0)) / 60000);
    crewStatusAge = (m2 < 1 ? (ru ? 'только что' : 'just now') : m2 < 90 ? m2 + ' ' + t.minAgo : Math.round(m2 / 60) + ' ' + t.hrAgo) + (stRec.by ? ' · ' + String(stRec.by).toUpperCase() : '');
  }

  const nextIdx = Math.min(STOPS.length - 1, Math.floor(p + 1e-6) + 1);
  const nextPoint = p >= LEGS.length ? t.finishWord : name(nextIdx) + ' · ~' + Math.max(0, kmAt(nextIdx) - km).toLocaleString(ru ? 'ru-RU' : 'en-US') + ' ' + t.kmUnit;

  const ictTime = new Date(now).toLocaleTimeString(ru ? 'ru-RU' : 'en-GB', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const startLabel = startMs != null
    ? (ru ? 'СТАРТ · ' : 'START · ') + fmtDate(startMs, ru, true).toUpperCase() + ' · ' + name(0).toUpperCase()
    : (ru ? 'СТАРТ СКОРО · ПХУКЕТ' : 'STARTING SOON · PHUKET');
  const datesLabel = startMs != null
    ? fmtDate(startMs, ru) + ' — ' + fmtDate(endMs, ru, true)
    : (ru ? 'старт скоро — финиш 15 ноября 2026' : 'start soon — finish 15 Nov 2026');

  return {
    phase, isSoon: phase === 'soon', isCountdown: phase === 'countdown', isJourney: phase === 'live' || phase === 'done', isDone: phase === 'done',
    startMs, endMs, totalDays, cd, day, km, totalKm: TOTAL_KM, ferries: LEGS.filter((l) => l.ferry).length, stopsCount: STOPS.length - 1,
    pos, posLabel, posCoords: pos.lat.toFixed(4) + ', ' + pos.lng.toFixed(4) + ' · ' + ageTxt, ageTxt, srcGps: pos.src === 'gps',
    routePct: Math.round((km / TOTAL_KM) * 100),
    stages, curStage, stageNo, stagePct: Math.max(0, Math.min(100, stagePct)),
    crewStatus, crewStatusAge, nextPoint, ictTime, startLabel, datesLabel,
  };
}
