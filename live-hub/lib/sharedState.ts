/**
 * Shared hub state — what the crew configures once and every visitor sees:
 * stream channels, pay / GPS endpoint URLs, the last real position, crew status, logbook.
 *
 * The Worker keeps it in a Durable Object (/api/state). Components keep reading the same
 * localStorage keys as the design prototype; this module mirrors the server copy into them.
 */
import { ls, setLs } from './storage';

const MAP = {
  channels: 'gtrpht_channels',
  integrations: 'gtrpht_integrations',
  pos: 'gtrpht_pos',
  status: 'gtrpht_status',
  posts: 'gtrpht_posts',
  tour: 'gtrpht_tour',
  garage: 'gtrpht_garage',
} as const;
type SharedKey = keyof typeof MAP;

const API = (process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/$/, '');
const CREW_LS = 'gtrpht_crew_key';

export function getCrewKey(): string {
  try { return localStorage.getItem(CREW_LS) || ''; } catch { return ''; }
}
export function setCrewKey(k: string): void {
  try {
    if (k) localStorage.setItem(CREW_LS, k.trim());
    else localStorage.removeItem(CREW_LS);
  } catch { /* ignore */ }
}

/** Pull the server copy into localStorage. Resolves true when anything changed. */
export async function pullShared(): Promise<boolean> {
  let data: Record<string, unknown>;
  try {
    const r = await fetch(API + '/api/state', { cache: 'no-store' });
    if (!r.ok) return false;
    data = await r.json();
  } catch {
    return false;
  }
  let changed = false;
  for (const k of Object.keys(MAP) as SharedKey[]) {
    const v = data[k];
    if (v === undefined) continue;
    const key = MAP[k];
    let next = v;
    // Keep device-only integration fields (bot tokens etc.) — the server only stores the public URLs.
    if (k === 'integrations' && v && typeof v === 'object') next = { ...ls<Record<string, unknown>>(key, {}), ...(v as object) };
    let prev: string | null = null;
    try { prev = localStorage.getItem(key); } catch { /* ignore */ }
    const s = JSON.stringify(next);
    if (prev !== s) {
      if (next === null) {
        try { localStorage.removeItem(key); } catch { /* ignore */ }
      } else setLs(key, next);
      changed = true;
    }
  }
  return changed;
}

export type PushResult = 'ok' | 'unauthorized' | 'invalid' | 'offline';

/** Crew-only write of a partial state. Local copy is written first so the editor never loses input. */
export async function pushShared(patch: Partial<Record<SharedKey, unknown>>): Promise<PushResult> {
  for (const k of Object.keys(patch) as SharedKey[]) {
    if (k === 'integrations') setLs(MAP[k], { ...ls<Record<string, unknown>>(MAP[k], {}), ...(patch[k] as object) });
    else setLs(MAP[k], patch[k]);
  }
  try {
    const r = await fetch(API + '/api/state', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Crew-Key': getCrewKey() },
      body: JSON.stringify(patch),
    });
    if (r.status === 401) return 'unauthorized';
    if (r.status === 400) return 'invalid';
    return r.ok ? 'ok' : 'offline';
  } catch {
    return 'offline';
  }
}
