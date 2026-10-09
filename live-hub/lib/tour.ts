/**
 * GTR|PHT tour model — ring route Phuket → Samui → Phangan → Chiang Mai → Ayutthaya → Bangkok
 * → Pattaya → Phuket, finishing on Phuket on 15 Nov 2026.
 *
 * The start date is configured by the crew (shared state `tour.start`). Until it is set the hub
 * shows "start soon". Stage lengths are relative weights scaled into [start, end], so moving the
 * start date reshapes the whole schedule without touching code.
 */

export type LatLng = [number, number];

export interface Stop { id: string; ru: string; en: string; ll: LatLng }
export const STOPS: Stop[] = [
  { id: 'phuket', ru: 'Пхукет', en: 'Phuket', ll: [7.8804, 98.3923] },
  { id: 'samui', ru: 'Самуи', en: 'Koh Samui', ll: [9.512, 100.0136] },
  { id: 'phangan', ru: 'Панган', en: 'Koh Phangan', ll: [9.711, 100.0118] },
  { id: 'chiangmai', ru: 'Чиангмай', en: 'Chiang Mai', ll: [18.7883, 98.9853] },
  { id: 'ayutthaya', ru: 'Аюттхая', en: 'Ayutthaya', ll: [14.3532, 100.5689] },
  { id: 'bangkok', ru: 'Бангкок', en: 'Bangkok', ll: [13.7563, 100.5018] },
  { id: 'pattaya', ru: 'Паттайя', en: 'Pattaya', ll: [12.9236, 100.8825] },
  { id: 'phuket-final', ru: 'Пхукет · финиш', en: 'Phuket · finish', ll: [7.8804, 98.3923] },
];

export interface Leg {
  path: LatLng[];
  km: number;
  /** index range of `path` that is a ferry crossing (inclusive start, exclusive end) */
  ferry?: [number, number];
  ru: string; en: string;
}
export const LEGS: Leg[] = [
  {
    path: [[7.8804, 98.3923], [8.1, 98.3], [8.2, 98.3], [8.45, 98.53], [8.85, 98.81], [9.14, 99.33], [9.31, 99.69], [9.535, 99.94], [9.512, 100.0136]],
    km: 290, ferry: [6, 8], ru: '290 км + паром Донсак → Самуи', en: '290 km + Don Sak → Samui ferry',
  },
  {
    path: [[9.512, 100.0136], [9.56, 100.03], [9.64, 100.03], [9.711, 100.0118]],
    km: 20, ferry: [0, 3], ru: 'паром на Панган · 30 мин', en: 'ferry to Phangan · 30 min',
  },
  {
    path: [[9.711, 100.0118], [9.31, 99.69], [9.6, 99.3], [10.49, 99.18], [11.81, 99.8], [12.57, 99.96], [13.11, 99.94], [13.82, 100.04], [15.7, 100.14], [16.48, 99.52], [16.88, 99.13], [18.29, 99.49], [18.7883, 98.9853]],
    km: 1330, ferry: [0, 1], ru: 'паром + 1 330 км на север · две ночёвки', en: 'ferry + 1,330 km north · two overnights',
  },
  {
    path: [[18.7883, 98.9853], [18.29, 99.49], [17.62, 100.1], [16.82, 100.26], [15.7, 100.14], [14.9, 100.4], [14.3532, 100.5689]],
    km: 620, ru: '620 км через Пхитсанулок', en: '620 km via Phitsanulok',
  },
  {
    path: [[14.3532, 100.5689], [14.02, 100.6], [13.7563, 100.5018]],
    km: 80, ru: '80 км до столицы', en: '80 km to the capital',
  },
  {
    path: [[13.7563, 100.5018], [13.66, 100.75], [13.36, 100.98], [12.9236, 100.8825]],
    km: 150, ru: '150 км к морю', en: '150 km to the coast',
  },
  {
    path: [[12.9236, 100.8825], [13.36, 100.98], [13.62, 100.62], [13.55, 100.27], [13.11, 99.94], [12.57, 99.96], [11.81, 99.8], [10.49, 99.18], [9.96, 98.64], [8.87, 98.35], [8.64, 98.25], [8.2, 98.3], [7.8804, 98.3923]],
    km: 1050, ru: '1 050 км домой по Андаманскому побережью', en: '1,050 km home along the Andaman coast',
  },
];

export const TOTAL_KM = LEGS.reduce((s, l) => s + l.km, 0);
export const FERRIES = LEGS.filter((l) => l.ferry).length;
export const END_MS = Date.parse('2026-11-15T20:00:00+07:00');
const DAY = 86400000;

/** Relative schedule: stay at stop i (days), then drive leg i (days). Last stop = finale. */
const STAY = [3, 3, 3.5, 4, 1.5, 3, 3, 1];
const DRIVE = [1, 0.5, 2.5, 1, 0.5, 0.5, 2];

/* ───────── geometry ───────── */
function segLen(a: LatLng, b: LatLng): number {
  const k = Math.cos(((a[0] + b[0]) / 2) * (Math.PI / 180));
  return Math.hypot((b[0] - a[0]), (b[1] - a[1]) * k);
}
const LEG_CUM: number[][] = LEGS.map((l) => {
  const c = [0];
  for (let i = 1; i < l.path.length; i++) c.push(c[i - 1] + segLen(l.path[i - 1], l.path[i]));
  return c;
});

/** Route parameter p ∈ [0, 7]: integer = at stop, fraction = share of the leg's length. */
export function pToLatLng(p: number): LatLng {
  p = Math.max(0, Math.min(LEGS.length, p));
  const i = Math.min(LEGS.length - 1, Math.floor(p));
  const f = p - i;
  const leg = LEGS[i], cum = LEG_CUM[i], target = f * cum[cum.length - 1];
  for (let j = 1; j < cum.length; j++) {
    if (target <= cum[j]) {
      const a = leg.path[j - 1], b = leg.path[j], t = (target - cum[j - 1]) / (cum[j] - cum[j - 1] || 1);
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    }
  }
  return leg.path[leg.path.length - 1];
}

/** Path from the start up to p — for the "covered" line on the map. */
export function pathUpTo(p: number): LatLng[] {
  const out: LatLng[] = [];
  for (let i = 0; i < LEGS.length; i++) {
    if (p <= i) break;
    const leg = LEGS[i], cum = LEG_CUM[i], f = Math.min(1, p - i), target = f * cum[cum.length - 1];
    for (let j = 0; j < leg.path.length; j++) {
      if (cum[j] <= target) out.push(leg.path[j]);
      else { out.push(pToLatLng(i + f)); break; }
    }
  }
  if (!out.length) out.push(STOPS[0].ll);
  return out;
}

/** Nearest point on the route to a GPS fix. `hint` (the schedule estimate) breaks ties on the ring. */
export function latLngToP(lat: number, lng: number, hint = 0): number {
  let best = Infinity, bp = 0;
  LEGS.forEach((leg, i) => {
    const cum = LEG_CUM[i], total = cum[cum.length - 1];
    for (let j = 1; j < leg.path.length; j++) {
      const a = leg.path[j - 1], b = leg.path[j];
      const k = Math.cos((lat * Math.PI) / 180);
      const ax = a[1] * k, ay = a[0], bx = b[1] * k, by = b[0], px = lng * k, py = lat;
      const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy || 1e-12;
      const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
      const d = Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
      const p = i + (cum[j - 1] + t * (cum[j] - cum[j - 1])) / total;
      const score = d + Math.abs(p - hint) * 0.02;
      if (score < best) { best = score; bp = p; }
    }
  });
  return bp;
}

export function kmAt(p: number): number {
  let km = 0;
  for (let i = 0; i < LEGS.length; i++) {
    if (p >= i + 1) km += LEGS[i].km;
    else if (p > i) km += LEGS[i].km * (p - i);
  }
  return Math.round(km);
}

/* ───────── schedule ───────── */
export interface Phase { stop: number; kind: 'stay' | 'drive'; s: number; e: number }

export function buildSchedule(startMs: number, endMs = END_MS): Phase[] {
  const weights: { stop: number; kind: 'stay' | 'drive'; w: number }[] = [];
  STAY.forEach((w, i) => {
    weights.push({ stop: i, kind: 'stay', w });
    if (i < DRIVE.length) weights.push({ stop: i, kind: 'drive', w: DRIVE[i] });
  });
  const W = weights.reduce((s, x) => s + x.w, 0);
  const span = Math.max(DAY, endMs - startMs);
  let t = startMs;
  return weights.map((x) => {
    const s = t;
    t += (x.w / W) * span;
    return { stop: x.stop, kind: x.kind, s, e: t };
  });
}

/** Planned route position at a moment. */
export function plannedP(now: number, sched: Phase[]): number {
  if (!sched.length || now <= sched[0].s) return 0;
  for (const ph of sched) {
    if (now < ph.e) return ph.kind === 'stay' ? ph.stop : ph.stop + (now - ph.s) / (ph.e - ph.s);
  }
  return LEGS.length;
}

/** Stage = time at a stop plus the drive that follows it. */
export interface StageSpan { stop: number; s: number; e: number; legRu: string; legEn: string }
export function stageSpans(sched: Phase[]): StageSpan[] {
  return STOPS.map((_, i) => {
    const stay = sched.find((p) => p.stop === i && p.kind === 'stay');
    const drive = sched.find((p) => p.stop === i && p.kind === 'drive');
    return {
      stop: i,
      s: stay ? stay.s : 0,
      e: (drive || stay)?.e || 0,
      legRu: LEGS[i] ? LEGS[i].ru : 'финиш тура',
      legEn: LEGS[i] ? LEGS[i].en : 'tour finish',
    };
  });
}

export const DAY_MS = DAY;

/** Route polyline between two parameters a < b (for the laser pulse). */
export function pathRange(a: number, b: number): LatLng[] {
  a = Math.max(0, a); b = Math.min(LEGS.length, b);
  if (b <= a) return [pToLatLng(a)];
  const out: LatLng[] = [pToLatLng(a)];
  const step = 0.02;
  for (let p = Math.ceil(a / step) * step; p < b; p += step) out.push(pToLatLng(p));
  out.push(pToLatLng(b));
  return out;
}
