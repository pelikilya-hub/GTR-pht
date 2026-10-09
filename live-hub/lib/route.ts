// Route model ported 1:1 from the GTR|PHT Live Hub prototype (Phuket -> Bangkok).
// WAY: [lat, lng, routeParam] control points; routeParam runs 0..10 across the whole route.
export const WAY: [number, number, number][] = [
  [7.820, 98.298, 0], [7.891, 98.398, 0.1], [8.451, 98.525, 0.4], [8.640, 98.900, 0.6],
  [9.070, 99.170, 0.8], [9.140, 99.330, 0.88], [9.310, 99.690, 1],
  [9.480, 99.950, 1.8], [9.560, 100.040, 2],
  [9.680, 100.060, 2.5], [9.731, 100.020, 3],
  [9.500, 99.850, 3.5], [9.310, 99.690, 4],
  [9.140, 99.330, 4.25], [8.630, 99.150, 4.55], [8.230, 98.980, 4.8], [8.090, 98.906, 4.9], [8.030, 98.822, 5],
  [8.280, 98.720, 5.12], [8.610, 98.600, 5.24], [8.890, 98.520, 5.34], [9.140, 99.100, 5.46], [9.400, 99.230, 5.54],
  [10.493, 99.180, 5.72], [11.200, 99.550, 5.84], [11.810, 99.800, 5.93], [12.568, 99.958, 6],
  [13.100, 99.940, 6.12], [13.820, 100.040, 6.28], [14.800, 100.120, 6.45], [15.700, 100.137, 6.62], [16.430, 99.900, 6.8], [17.010, 99.790, 7],
  [17.630, 99.760, 7.3], [18.290, 99.490, 7.65], [18.590, 99.230, 7.85], [18.788, 98.985, 8],
  [18.290, 99.490, 8.15], [16.880, 99.126, 8.45], [16.470, 99.520, 8.6], [15.700, 100.137, 8.75], [14.900, 100.370, 8.9], [14.353, 100.568, 9],
  [13.900, 100.610, 9.5], [13.750, 100.500, 10],
];

export function paramToLatLng(p: number): [number, number] {
  const W = WAY;
  p = Math.max(0, Math.min(10, p));
  for (let i = 0; i < W.length - 1; i++) {
    const a = W[i], b = W[i + 1];
    if (p >= a[2] && p <= b[2]) {
      const f = b[2] - a[2] ? (p - a[2]) / (b[2] - a[2]) : 0;
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
    }
  }
  const l = W[W.length - 1];
  return [l[0], l[1]];
}

export function latLngToParam(lat: number, lng: number): number {
  const W = WAY;
  const k = Math.cos((lat * Math.PI) / 180);
  let best = 1e18, bp = 0;
  for (let i = 0; i < W.length - 1; i++) {
    const a = W[i], b = W[i + 1];
    const ax = a[1] * k, ay = a[0], bx = b[1] * k, by = b[0], px = lng * k, py = lat;
    const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy || 1e-12;
    let tt = ((px - ax) * dx + (py - ay) * dy) / len2;
    tt = Math.max(0, Math.min(1, tt));
    const qx = ax + dx * tt, qy = ay + dy * tt, d2 = (px - qx) * (px - qx) + (py - qy) * (py - qy);
    if (d2 < best) { best = d2; bp = a[2] + (b[2] - a[2]) * tt; }
  }
  return bp;
}

export function cumKm(): number[] {
  return [0, 370, 370, 370, 370, 600, 1250, 1850, 2150, 2750, 2830];
}

// Anchor table: real-world timestamp -> route param (0..10). Interpolated linearly between anchors.
const ANCHORS_RAW: [string, number][] = [
  ['2026-08-05T08:00', 0], ['2026-08-05T17:00', 2], ['2026-08-12T11:00', 2], ['2026-08-12T12:30', 3],
  ['2026-08-21T07:00', 3], ['2026-08-21T15:00', 5], ['2026-08-27T08:00', 5], ['2026-08-16T18:00', 6],
  ['2026-08-17T09:00', 6], ['2026-08-17T18:00', 7], ['2026-08-18T10:00', 7], ['2026-08-18T15:00', 8],
  ['2026-08-24T07:00', 8], ['2026-08-24T16:00', 9], ['2026-08-25T10:00', 9], ['2026-08-25T12:00', 10],
];
let ANCH: [number, number][] | null = null;
function anchors(): [number, number][] {
  if (!ANCH) ANCH = ANCHORS_RAW.map(([s, p]) => [Date.parse(s + ':00+07:00'), p]);
  return ANCH;
}

export function routeParam(now: number): number {
  const A = anchors();
  if (now <= A[0][0]) return 0;
  for (let i = 0; i < A.length - 1; i++) {
    const [t1, p1] = A[i], [t2, p2] = A[i + 1];
    if (now >= t1 && now < t2) return p1 === p2 ? p1 : p1 + (p2 - p1) * ((now - t1) / (t2 - t1));
  }
  return 10;
}

export function names(ru: boolean): Record<number, string> {
  return ru
    ? { 0: 'Пхукет', 1: 'Донсак', 2: 'Самуи', 3: 'Панган', 5: 'Ао Нанг', 6: 'Хуахин', 7: 'Сукхотай', 8: 'Чиангмай', 9: 'Аюттайя', 10: 'Бангкок' }
    : { 0: 'Phuket', 1: 'Don Sak', 2: 'Samui', 3: 'Phangan', 5: 'Ao Nang', 6: 'Hua Hin', 7: 'Sukhothai', 8: 'Chiang Mai', 9: 'Ayutthaya', 10: 'Bangkok' };
}

export interface ResolvedPos {
  lat: number;
  lng: number;
  p: number;
  src: 'gps' | 'plan';
  by: string;
  ts: number;
}
