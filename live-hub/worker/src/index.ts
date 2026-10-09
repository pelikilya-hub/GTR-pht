/**
 * GTR|PHT Live Hub — Cloudflare Worker
 *
 *  /api/hook            POST  → relays hub events to the Make.com webhook (secret, server-side)
 *  /api/turn            GET   → short-lived ICE servers from Cloudflare Realtime TURN
 *  /api/rt/session      POST  → new Realtime SFU session
 *  /api/rt/tracks       POST  → publish (local) or pull (remote) tracks on a session
 *  /api/rt/renegotiate  PUT   → finish a renegotiation with the client's answer
 *  /api/rt/tracks/close PUT   → close tracks
 *  /api/state           GET   → shared hub state (stream channels, pay/GPS URLs, position, crew status, logbook)
 *  /api/state           PUT   → crew-only partial update of the shared state
 *  /api/pos             POST  → crew-only GPS push (plain {lat,lng,ts} or OwnTracks {_type:'location',lat,lon,tst})
 *  /api/crew/check      GET   → 204 if the X-Crew-Key header matches CREW_KEY, else 401
 *  /ws/:room            WS    → room signaling (presence, track announcements, tally, commands)
 *  everything else            → static assets from ./out (the Next.js export)
 *
 * The Realtime App Secret and TURN key never leave this Worker.
 * CREW_KEY gates everything that can change what viewers see: camera/pult roles in a room,
 * publishing tracks to the SFU, and writes to the shared state.
 */

export interface Env {
  ROOM: DurableObjectNamespace;
  HUB: DurableObjectNamespace;
  CREW_KEY?: string;
  ASSETS: Fetcher;
  ALLOWED_ROOMS?: string;
  REALTIME_APP_ID?: string;
  REALTIME_APP_SECRET?: string;
  TURN_KEY_ID?: string;
  TURN_KEY_TOKEN?: string;
  MAKE_WEBHOOK_URL?: string;
}

const RT_BASE = 'https://rtc.live.cloudflare.com/v1';
const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Crew-Key, Authorization',
};

function json(data: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...CORS, ...extra } });
}
function bad(msg: string, status = 400): Response {
  return json({ error: msg }, status);
}
function roomAllowed(env: Env, room: string): boolean {
  const list = (env.ALLOWED_ROOMS || 'gtrpht').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  return list.includes(room.toLowerCase());
}

function safeEqual(a: string, b: string): boolean {
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}
/** No CREW_KEY configured → open (local dev). Configured → header, bearer or ?key= must match. */
function isCrew(env: Env, req: Request, url: URL): boolean {
  if (!env.CREW_KEY) return true;
  const auth = req.headers.get('Authorization') || '';
  const k = req.headers.get('X-Crew-Key') || (auth.startsWith('Bearer ') ? auth.slice(7) : '') || url.searchParams.get('key') || '';
  return !!k && safeEqual(k, env.CREW_KEY);
}

/* ── shared state validation ── */
const CH_KEYS = ['twitch', 'youtube', 'kick', 'vk', 'telegram', 'tiktok'];
const STATUS_CODES = ['drive', 'base', 'ferry', 'live', 'stop'];
const POST_TYPES = ['post', 'mat', 'hyp', 'obs'];
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const httpUrl = (v: unknown) => { const s = str(v, 500); return !s || /^https:\/\//i.test(s) ? s : null; };
const num = (v: unknown) => (typeof v === 'number' ? v : typeof v === 'string' ? parseFloat(v) : NaN);

interface HubPatch {
  channels?: Record<string, string>;
  integrations?: { payUrl?: string; posUrl?: string };
  pos?: { lat: number; lng: number; ts: number; by?: string; src?: string } | null;
  status?: { code: string; ts: number; by?: string } | null;
  posts?: { id: string; ts: number; member: string; type: string; text: string; link?: string }[];
}

function validatePatch(b: Record<string, unknown>): HubPatch | string {
  const out: HubPatch = {};
  if (b.channels !== undefined) {
    if (!b.channels || typeof b.channels !== 'object') return 'channels must be an object';
    const c: Record<string, string> = {};
    for (const k of CH_KEYS) c[k] = str((b.channels as Record<string, unknown>)[k], 200);
    out.channels = c;
  }
  if (b.integrations !== undefined) {
    const i = (b.integrations || {}) as Record<string, unknown>;
    const payUrl = httpUrl(i.payUrl), posUrl = httpUrl(i.posUrl);
    if (payUrl === null || posUrl === null) return 'payUrl / posUrl must be https:// URLs';
    out.integrations = { payUrl, posUrl };
  }
  if (b.pos !== undefined) {
    if (b.pos === null) out.pos = null;
    else {
      const p = b.pos as Record<string, unknown>;
      const lat = num(p.lat), lng = num(p.lng);
      if (!isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return 'pos.lat / pos.lng invalid';
      out.pos = { lat, lng, ts: isFinite(num(p.ts)) ? num(p.ts) : Date.now(), by: str(p.by, 24), src: 'gps' };
    }
  }
  if (b.status !== undefined) {
    if (b.status === null) out.status = null;
    else {
      const st = b.status as Record<string, unknown>;
      if (!STATUS_CODES.includes(String(st.code))) return 'status.code must be one of ' + STATUS_CODES.join(',');
      out.status = { code: String(st.code), ts: isFinite(num(st.ts)) ? num(st.ts) : Date.now(), by: str(st.by, 24) };
    }
  }
  if (b.posts !== undefined) {
    if (!Array.isArray(b.posts)) return 'posts must be an array';
    out.posts = b.posts.slice(0, 50).map((x, i) => {
      const p = (x || {}) as Record<string, unknown>;
      const type = POST_TYPES.includes(String(p.type)) ? String(p.type) : 'post';
      return { id: str(p.id, 40) || String(Date.now()) + '-' + i, ts: isFinite(num(p.ts)) ? num(p.ts) : Date.now(), member: str(p.member, 24), type, text: str(p.text, 1200), link: httpUrl(p.link) || '' };
    });
  }
  return out;
}

function hubStub(env: Env) {
  return env.HUB.get(env.HUB.idFromName('gtrpht'));
}

async function rtFetch(env: Env, path: string, method: string, body?: unknown): Promise<Response> {
  if (!env.REALTIME_APP_ID || !env.REALTIME_APP_SECRET) return bad('Realtime SFU is not configured on the server (REALTIME_APP_ID / REALTIME_APP_SECRET)', 503);
  const r = await fetch(`${RT_BASE}/apps/${env.REALTIME_APP_ID}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.REALTIME_APP_SECRET}` },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await r.text();
  return new Response(text, { status: r.status, headers: { 'Content-Type': 'application/json', ...CORS } });
}

async function handleApi(req: Request, env: Env, url: URL): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  const p = url.pathname;

  if (p === '/api/health') return json({ ok: true, sfu: !!env.REALTIME_APP_ID, turn: !!env.TURN_KEY_ID, hook: !!env.MAKE_WEBHOOK_URL, crew: !!env.CREW_KEY });

  if (p === '/api/crew/check') return isCrew(env, req, url) ? new Response(null, { status: 204, headers: CORS }) : bad('crew key required', 401);

  if (p === '/api/state' && req.method === 'GET') {
    const r = await hubStub(env).fetch('https://hub/state');
    return new Response(r.body, { status: r.status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...CORS } });
  }
  if (p === '/api/state' && (req.method === 'PUT' || req.method === 'POST')) {
    if (!isCrew(env, req, url)) return bad('crew key required', 401);
    const raw = await req.text();
    if (raw.length > 128 * 1024) return bad('payload too large', 413);
    let body: Record<string, unknown>;
    try { body = JSON.parse(raw); } catch { return bad('invalid JSON'); }
    const patch = validatePatch(body || {});
    if (typeof patch === 'string') return bad(patch);
    const r = await hubStub(env).fetch('https://hub/state', { method: 'PUT', body: JSON.stringify(patch) });
    return new Response(r.body, { status: r.status, headers: { 'Content-Type': 'application/json', ...CORS } });
  }
  if (p === '/api/pos' && req.method === 'POST') {
    if (!isCrew(env, req, url)) return bad('crew key required', 401);
    const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!b) return bad('invalid JSON');
    // OwnTracks: {_type:'location', lat, lon, tst(sec), tid}; plain: {lat, lng, ts(ms), by}
    const own = b._type === 'location';
    const patch = validatePatch({ pos: { lat: b.lat, lng: own ? b.lon : b.lng ?? b.lon, ts: own ? num(b.tst) * 1000 : b.ts, by: b.by ?? b.tid ?? 'gps' } });
    if (typeof patch === 'string') return bad(patch);
    await hubStub(env).fetch('https://hub/state', { method: 'PUT', body: JSON.stringify(patch) });
    return own ? json([]) : json({ ok: true, pos: patch.pos });
  }

  if (p === '/api/hook' && req.method === 'POST') {
    const body = await req.text();
    if (body.length > 64 * 1024) return bad('payload too large', 413);
    if (!env.MAKE_WEBHOOK_URL) return new Response(null, { status: 204, headers: { ...CORS, 'X-Hook': 'unconfigured' } });
    try {
      const r = await fetch(env.MAKE_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
      return new Response(null, { status: r.ok ? 204 : 502, headers: { ...CORS, 'X-Hook': String(r.status) } });
    } catch {
      return new Response(null, { status: 502, headers: CORS });
    }
  }

  if (p === '/api/turn' && req.method === 'GET') {
    if (!env.TURN_KEY_ID || !env.TURN_KEY_TOKEN) {
      return json({ iceServers: [{ urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.l.google.com:19302'] }], turn: false });
    }
    const r = await fetch(`${RT_BASE}/turn/keys/${env.TURN_KEY_ID}/credentials/generate-ice-servers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.TURN_KEY_TOKEN}` },
      body: JSON.stringify({ ttl: 86400 }),
    });
    if (!r.ok) return json({ iceServers: [{ urls: ['stun:stun.cloudflare.com:3478'] }], turn: false, error: r.status });
    const data = (await r.json()) as { iceServers?: unknown };
    return json({ ...data, turn: true });
  }

  if (p === '/api/rt/session' && req.method === 'POST') return rtFetch(env, '/sessions/new', 'POST');

  if (p === '/api/rt/tracks' && req.method === 'POST') {
    const body = (await req.json().catch(() => null)) as { sessionId?: string; tracks?: { location?: string }[] } | null;
    if (!body?.sessionId) return bad('sessionId required');
    // Publishing (local tracks) is crew-only; pulling remote tracks is open to every viewer.
    if ((body.tracks || []).some((t) => t && t.location === 'local') && !isCrew(env, req, url)) return bad('crew key required', 401);
    const { sessionId, ...rest } = body;
    return rtFetch(env, `/sessions/${encodeURIComponent(sessionId)}/tracks/new`, 'POST', rest);
  }
  if (p === '/api/rt/renegotiate' && req.method === 'PUT') {
    const body = (await req.json().catch(() => null)) as { sessionId?: string } | null;
    if (!body?.sessionId) return bad('sessionId required');
    const { sessionId, ...rest } = body;
    return rtFetch(env, `/sessions/${encodeURIComponent(sessionId)}/renegotiate`, 'PUT', rest);
  }
  if (p === '/api/rt/tracks/close' && req.method === 'PUT') {
    const body = (await req.json().catch(() => null)) as { sessionId?: string } | null;
    if (!body?.sessionId) return bad('sessionId required');
    const { sessionId, ...rest } = body;
    return rtFetch(env, `/sessions/${encodeURIComponent(sessionId)}/tracks/close`, 'PUT', rest);
  }

  return bad('not found', 404);
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname.startsWith('/api/')) return handleApi(req, env, url);

    const m = url.pathname.match(/^\/ws\/([A-Za-z0-9_-]{1,32})\/?$/);
    if (m) {
      const room = m[1].toLowerCase();
      if (!roomAllowed(env, room)) return bad('room not allowed', 403);
      if (req.headers.get('Upgrade')?.toLowerCase() !== 'websocket') return bad('expected websocket', 426);
      const role = url.searchParams.get('role') || 'view';
      if (role !== 'view' && !isCrew(env, req, url)) return bad('crew key required', 401);
      const id = env.ROOM.idFromName(room);
      return env.ROOM.get(id).fetch(req);
    }

    return env.ASSETS.fetch(req);
  },
};

/* ───────────────────────── Room signaling (Durable Object) ─────────────────────────
 * One instance per room. Uses the WebSocket Hibernation API, so an idle room costs nothing.
 * Peer metadata is attached to the socket (survives hibernation).
 *
 * Client → DO
 *   {type:'announce', session, tracks:[{trackName,kind}], state:{...}}   camera publishes its SFU session
 *   {type:'state', state:{...}}                                            camera telemetry (res/fps/mic/facing)
 *   {type:'cmd', to, cmd, value}                                           director → camera
 *   {type:'log', msg}                                                      camera → directors/viewers
 * DO → client
 *   {type:'hello', id, peers:[Peer]}   on connect
 *   {type:'peer', peer:Peer}           a peer joined / updated
 *   {type:'leave', id}                 a peer left
 *   {type:'cmd', from, cmd, value}     relayed command
 *   {type:'log', from, slot, msg}      relayed log line
 */
interface Peer {
  id: string;
  role: 'cam' | 'dir' | 'view';
  slot: string;
  name: string;
  session?: string;
  tracks?: { trackName: string; kind: string }[];
  state?: Record<string, unknown>;
}

export class RoomSignal implements DurableObject {
  constructor(private ctx: DurableObjectState) {
    this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
  }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const role = (url.searchParams.get('role') || 'view') as Peer['role'];
    const slot = (url.searchParams.get('slot') || '').replace(/[^a-z0-9]/gi, '').slice(0, 16);
    const name = (url.searchParams.get('name') || '').slice(0, 40);
    if (!['cam', 'dir', 'view'].includes(role)) return new Response('bad role', { status: 400 });
    if (role === 'cam' && !slot) return new Response('camera needs a slot', { status: 400 });

    // A slot is exclusive: a new camera on an occupied slot bumps the old one (phone reload, crash, etc.).
    if (role === 'cam') {
      for (const ws of this.ctx.getWebSockets()) {
        const p = this.peerOf(ws);
        if (p && p.role === 'cam' && p.slot === slot) {
          try { ws.send(JSON.stringify({ type: 'bumped', by: name })); ws.close(4001, 'slot taken over'); } catch { /* ignore */ }
        }
      }
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair) as [WebSocket, WebSocket];
    const peer: Peer = { id: crypto.randomUUID().slice(0, 8), role, slot, name };
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment(peer);

    const peers = this.allPeers().filter((p) => p.id !== peer.id);
    server.send(JSON.stringify({ type: 'hello', id: peer.id, peers }));
    this.broadcast({ type: 'peer', peer }, peer.id);
    return new Response(null, { status: 101, webSocket: client });
  }

  private peerOf(ws: WebSocket): Peer | null {
    try { return (ws.deserializeAttachment() as Peer) || null; } catch { return null; }
  }
  private allPeers(): Peer[] {
    return this.ctx.getWebSockets().map((ws) => this.peerOf(ws)).filter((p): p is Peer => !!p);
  }
  private broadcast(msg: unknown, exceptId?: string) {
    const s = JSON.stringify(msg);
    for (const ws of this.ctx.getWebSockets()) {
      const p = this.peerOf(ws);
      if (!p || p.id === exceptId) continue;
      try { ws.send(s); } catch { /* ignore */ }
    }
  }
  private sendTo(id: string, msg: unknown) {
    const s = JSON.stringify(msg);
    for (const ws of this.ctx.getWebSockets()) {
      const p = this.peerOf(ws);
      if (p && p.id === id) { try { ws.send(s); } catch { /* ignore */ } return; }
    }
  }

  async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer) {
    const me = this.peerOf(ws);
    if (!me || typeof raw !== 'string' || raw.length > 16 * 1024) return;
    let m: { type?: string; [k: string]: unknown };
    try { m = JSON.parse(raw); } catch { return; }

    if (m.type === 'announce' && me.role === 'cam') {
      me.session = typeof m.session === 'string' ? m.session : undefined;
      me.tracks = Array.isArray(m.tracks) ? (m.tracks as Peer['tracks']) : [];
      me.state = (m.state as Record<string, unknown>) || me.state;
      ws.serializeAttachment(me);
      this.broadcast({ type: 'peer', peer: me }, me.id);
    } else if (m.type === 'state' && me.role === 'cam') {
      me.state = (m.state as Record<string, unknown>) || {};
      ws.serializeAttachment(me);
      this.broadcast({ type: 'peer', peer: me }, me.id);
    } else if (m.type === 'cmd' && me.role === 'dir' && typeof m.to === 'string') {
      this.sendTo(m.to, { type: 'cmd', from: me.id, cmd: m.cmd, value: m.value });
    } else if (m.type === 'log' && me.role === 'cam') {
      this.broadcast({ type: 'log', from: me.id, slot: me.slot, msg: String(m.msg || '').slice(0, 300) }, me.id);
    } else if (m.type === 'who') {
      ws.send(JSON.stringify({ type: 'hello', id: me.id, peers: this.allPeers().filter((p) => p.id !== me.id) }));
    }
  }

  async webSocketClose(ws: WebSocket) {
    const me = this.peerOf(ws);
    if (me) this.broadcast({ type: 'leave', id: me.id }, me.id);
  }
  async webSocketError(ws: WebSocket) {
    const me = this.peerOf(ws);
    if (me) this.broadcast({ type: 'leave', id: me.id }, me.id);
  }
}

/* ───────────────────────── Shared hub state (Durable Object) ─────────────────────────
 * One instance ("gtrpht"). Holds what the crew configures for every visitor: stream channels,
 * pay / GPS endpoint URLs, the last real position, crew status and the logbook.
 * Input is validated in the Worker before it gets here.
 */
interface HubStateData {
  v: number;
  channels?: Record<string, string>;
  integrations?: { payUrl?: string; posUrl?: string };
  pos?: unknown;
  status?: unknown;
  posts?: unknown[];
}

export class HubState implements DurableObject {
  constructor(private ctx: DurableObjectState) {}

  async fetch(req: Request): Promise<Response> {
    const cur = ((await this.ctx.storage.get<HubStateData>('state')) || { v: 0 }) as HubStateData;
    if (req.method === 'PUT') {
      const patch = (await req.json()) as Partial<HubStateData>;
      const next: HubStateData = { ...cur, ...patch, v: Date.now() };
      if (patch.integrations) next.integrations = { ...(cur.integrations || {}), ...patch.integrations };
      await this.ctx.storage.put('state', next);
      return new Response(JSON.stringify(next), { headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify(cur), { headers: { 'Content-Type': 'application/json' } });
  }
}
