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
 *  /api/media/list      GET   → crew-only: files in the R2 media library + a 12 h read token
 *  /api/media/file/<p>  GET   → crew token (?t=) or key: stream a library file (byte ranges, ?dl=1 to download)
 *  /api/media/upload    PUT   → crew-only: stream a file into the library (?path=raw/…/name.mp4)
 *  /ws/:room            WS    → room signaling (presence, track announcements, tally, commands)
 *  /chat/ws             WS    → live chat (history, rate limit, crew moderation with ?key=CREW_KEY)
 *  everything else            → static assets from ./out (the Next.js export)
 *
 * The Realtime App Secret and TURN key never leave this Worker.
 * CREW_KEY gates everything that can change what viewers see: camera/pult roles in a room,
 * publishing tracks to the SFU, and writes to the shared state.
 */

export interface Env {
  ROOM: DurableObjectNamespace;
  HUB: DurableObjectNamespace;
  CHAT: DurableObjectNamespace;
  CREW_KEY?: string;
  ASSETS: Fetcher;
  ALLOWED_ROOMS?: string;
  REALTIME_APP_ID?: string;
  REALTIME_APP_SECRET?: string;
  TURN_KEY_ID?: string;
  TURN_KEY_TOKEN?: string;
  MAKE_WEBHOOK_URL?: string;
  MEDIA?: R2Bucket;
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
/** Fail closed: without a CREW_KEY secret nobody is crew (local dev sets it in .dev.vars). */
function isCrew(env: Env, req: Request, url: URL): boolean {
  if (!env.CREW_KEY) return false;
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
  tour?: { start: string | null };
  garage?: { id: string; name: string; year: string; city: string; stage: string; paid: string; note: string; img: string; ts: number }[];
  promo?: { a: string; b: string }[];
}
const CAR_STAGES = ['hunt', 'bought', 'restore', 'parts', 'done', 'sold'];

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
  if (b.tour !== undefined) {
    const tr = (b.tour || {}) as Record<string, unknown>;
    if (tr.start === null || tr.start === '' || tr.start === undefined) out.tour = { start: null };
    else {
      const ms = Date.parse(String(tr.start));
      if (!isFinite(ms)) return 'tour.start must be an ISO date';
      out.tour = { start: new Date(ms).toISOString() };
    }
  }
  if (b.garage !== undefined) {
    if (!Array.isArray(b.garage)) return 'garage must be an array';
    out.garage = b.garage.slice(0, 40).map((x, i) => {
      const c = (x || {}) as Record<string, unknown>;
      const img = httpUrl(c.img) || (typeof c.img === 'string' && /^\/assets\//.test(c.img) ? c.img.slice(0, 200) : '');
      return {
        id: str(c.id, 40) || String(Date.now()) + '-' + i, name: str(c.name, 80), year: str(c.year, 12), city: str(c.city, 40),
        stage: CAR_STAGES.includes(String(c.stage)) ? String(c.stage) : 'hunt', paid: str(c.paid, 40), note: str(c.note, 600), img,
        ts: isFinite(num(c.ts)) ? num(c.ts) : Date.now(),
      };
    });
  }
  if (b.promo !== undefined) {
    if (!Array.isArray(b.promo)) return 'promo must be an array';
    out.promo = b.promo.slice(0, 12).map((x) => { const c = (x || {}) as Record<string, unknown>; return { a: str(c.a, 48), b: str(c.b, 48) }; }).filter((c) => c.a);
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

  if (p.startsWith('/api/media/')) return handleMedia(req, env, url);

  // guests pick GTR Event happenings along the route: GET counts, POST {id} = one vote per visitor per event
  if (p === '/api/route-votes') {
    if (req.method === 'GET') {
      const r = await hubStub(env).fetch('https://hub/votes');
      return new Response(await r.text(), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...CORS } });
    }
    if (req.method === 'POST') {
      const b = (await req.json().catch(() => null)) as { id?: unknown } | null;
      const id = typeof b?.id === 'string' ? b.id.trim().slice(0, 80) : '';
      if (!id || !/^[\w:.\-]+$/.test(id)) return bad('bad id');
      const ip = req.headers.get('CF-Connecting-IP') || '0';
      const voter = (await hmacHex(env.CREW_KEY || 'bts', 'voter:' + ip)).slice(0, 16);
      const r = await hubStub(env).fetch('https://hub/votes', { method: 'POST', body: JSON.stringify({ id, voter }) });
      return new Response(await r.text(), { headers: { 'Content-Type': 'application/json', ...CORS } });
    }
  }

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

    if (url.pathname === '/chat/ws' || url.pathname === '/chat/ws/') {
      if (req.headers.get('Upgrade')?.toLowerCase() !== 'websocket') return bad('expected websocket', 426);
      const crew = !!env.CREW_KEY && !!url.searchParams.get('key') && isCrew(env, req, url);
      const fwd = new URL(req.url);
      fwd.searchParams.delete('key');
      fwd.searchParams.set('crew', crew ? '1' : '0');
      fwd.searchParams.set('ip', req.headers.get('CF-Connecting-IP') || '0');
      return env.CHAT.get(env.CHAT.idFromName('main')).fetch(new Request(fwd.toString(), req));
    }

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

    if (/^\/assets\/(audio|video|scales)\/.+\.(mp3|m4a|mp4|webm)$/.test(url.pathname) && (req.method === 'GET' || req.method === 'HEAD')) return serveMedia(req, env);

    return env.ASSETS.fetch(req);
  },
};

/**
 * Audio / video with HTTP byte ranges. The static-asset server answers every request with a full
 * 200, which breaks seeking in Chrome and makes iOS Safari refuse or drop media playback (it requires
 * 206 Partial Content). Files here are small (≤ 6 MB), so slicing the asset body is cheap.
 */
async function serveMedia(req: Request, env: Env): Promise<Response> {
  const plain = new Request(req.url, { method: 'GET', headers: { Accept: req.headers.get('Accept') || '*/*' } });
  const res = await env.ASSETS.fetch(plain);
  if (res.status !== 200) return res;
  const h = new Headers(res.headers);
  h.set('Accept-Ranges', 'bytes');
  h.set('Cache-Control', /\.json$/.test(new URL(req.url).pathname) ? 'no-cache' : 'public, max-age=86400, stale-while-revalidate=604800');
  h.delete('Content-Encoding');
  const etag = h.get('ETag');
  if (etag && req.headers.get('If-None-Match') === etag) return new Response(null, { status: 304, headers: h });

  const range = req.headers.get('Range');
  const ifRange = req.headers.get('If-Range');
  const body = await res.arrayBuffer();
  const size = body.byteLength;
  const m = range && (!ifRange || ifRange === etag) ? range.match(/^bytes=(\d*)-(\d*)$/) : null;
  if (!m || (m[1] === '' && m[2] === '')) {
    h.set('Content-Length', String(size));
    return new Response(req.method === 'HEAD' ? null : body, { status: 200, headers: h });
  }
  let start: number, end: number;
  if (m[1] === '') { start = Math.max(0, size - Number(m[2])); end = size - 1; } // suffix: last N bytes
  else { start = Number(m[1]); end = m[2] === '' ? size - 1 : Math.min(Number(m[2]), size - 1); }
  if (start >= size || start > end) {
    h.set('Content-Range', `bytes */${size}`);
    return new Response(null, { status: 416, headers: h });
  }
  h.set('Content-Range', `bytes ${start}-${end}/${size}`);
  h.set('Content-Length', String(end - start + 1));
  return new Response(req.method === 'HEAD' ? null : body.slice(start, end + 1), { status: 206, headers: h });
}

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
  tour?: unknown;
  garage?: unknown[];
  promo?: unknown[];
}

export class HubState implements DurableObject {
  constructor(private ctx: DurableObjectState) {}

  async fetch(req: Request): Promise<Response> {
    const path = new URL(req.url).pathname;
    // route-event votes ("хочу сюда"): counts + one vote per voter hash per event, kept apart from 'state'
    if (path === '/votes') {
      const votes = (await this.ctx.storage.get<Record<string, number>>('votes')) || {};
      if (req.method === 'POST') {
        const { id, voter } = (await req.json()) as { id: string; voter: string };
        const seenKey = 'v:' + voter + ':' + id;
        if (!(await this.ctx.storage.get(seenKey))) {
          if (Object.keys(votes).length < 2000 || votes[id]) votes[id] = (votes[id] || 0) + 1;
          await this.ctx.storage.put({ votes, [seenKey]: 1 });
        }
      }
      return new Response(JSON.stringify({ votes }), { headers: { 'Content-Type': 'application/json' } });
    }
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

/* ───────────────────────── Live chat (Durable Object) ─────────────────────────
 * Client → DO: {type:'msg', nick, text} · crew only: {type:'del', id} · {type:'ban', author}
 * DO → client: {type:'hello', you, crew, history, online} · {type:'msg', m} · {type:'del', id}
 *              {type:'online', n} · {type:'err', code, text}
 * Authors are identified by a salted hash of the IP, never the IP itself.
 */
interface ChatMsg { id: string; ts: number; nick: string; text: string; crew: boolean; author: string }
interface ChatPeer { author: string; crew: boolean; last: number; burst: number }

export class ChatRoom implements DurableObject {
  constructor(private ctx: DurableObjectState) {
    this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
  }

  private async hash(ip: string): Promise<string> {
    const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('gtrpht-chat:' + ip));
    return [...new Uint8Array(d)].slice(0, 6).map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const author = await this.hash(url.searchParams.get('ip') || '0');
    const crew = url.searchParams.get('crew') === '1';
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair) as [WebSocket, WebSocket];
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ author, crew, last: 0, burst: 0 } as ChatPeer);
    const history = ((await this.ctx.storage.get<ChatMsg[]>('msgs')) || []).slice(-80);
    const online = this.ctx.getWebSockets().length;
    server.send(JSON.stringify({ type: 'hello', you: author, crew, history: history.map((m) => this.pub(m, crew)), online }));
    this.broadcast({ type: 'online', n: online });
    return new Response(null, { status: 101, webSocket: client });
  }

  private pub(m: ChatMsg, forCrew: boolean) {
    return forCrew ? m : { ...m, author: m.author.slice(0, 4) };
  }
  private broadcast(msg: unknown) {
    const s = JSON.stringify(msg);
    for (const ws of this.ctx.getWebSockets()) { try { ws.send(s); } catch { /* ignore */ } }
  }

  async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer) {
    if (typeof raw !== 'string' || raw.length > 2048) return;
    const me = ws.deserializeAttachment() as ChatPeer;
    let m: Record<string, unknown>;
    try { m = JSON.parse(raw); } catch { return; }
    const err = (code: string, text: string) => ws.send(JSON.stringify({ type: 'err', code, text }));

    if (m.type === 'msg') {
      const bans = (await this.ctx.storage.get<Record<string, number>>('bans')) || {};
      if (!me.crew && bans[me.author] && bans[me.author] > Date.now()) return err('banned', 'chat muted');
      const now = Date.now();
      // 1 message / 2 s, burst of 3, then 10 s cool-down
      if (!me.crew) {
        if (now - me.last < 2000) { me.burst += 1; if (me.burst > 3) { ws.serializeAttachment(me); return err('slow', 'too fast'); } } else me.burst = 0;
      }
      const nick = String(m.nick || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 24);
      const text = String(m.text || '').replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '').trim().slice(0, 300);
      if (nick.length < 2) return err('nick', 'nick too short');
      if (!text) return;
      me.last = now; ws.serializeAttachment(me);
      const msg: ChatMsg = { id: now.toString(36) + Math.random().toString(36).slice(2, 6), ts: now, nick, text, crew: me.crew, author: me.author };
      const msgs = (await this.ctx.storage.get<ChatMsg[]>('msgs')) || [];
      msgs.push(msg);
      await this.ctx.storage.put('msgs', msgs.slice(-200));
      for (const peer of this.ctx.getWebSockets()) {
        const pm = peer.deserializeAttachment() as ChatPeer;
        try { peer.send(JSON.stringify({ type: 'msg', m: this.pub(msg, pm.crew) })); } catch { /* ignore */ }
      }
    } else if (m.type === 'del' && me.crew && typeof m.id === 'string') {
      const msgs = ((await this.ctx.storage.get<ChatMsg[]>('msgs')) || []).filter((x) => x.id !== m.id);
      await this.ctx.storage.put('msgs', msgs);
      this.broadcast({ type: 'del', id: m.id });
    } else if (m.type === 'ban' && me.crew && typeof m.author === 'string') {
      const bans = (await this.ctx.storage.get<Record<string, number>>('bans')) || {};
      bans[m.author] = Date.now() + 24 * 3600 * 1000;
      await this.ctx.storage.put('bans', bans);
      const msgs = ((await this.ctx.storage.get<ChatMsg[]>('msgs')) || []);
      const gone = msgs.filter((x) => x.author === m.author).map((x) => x.id);
      await this.ctx.storage.put('msgs', msgs.filter((x) => x.author !== m.author));
      gone.forEach((id) => this.broadcast({ type: 'del', id }));
    }
  }

  async webSocketClose() { this.broadcast({ type: 'online', n: Math.max(0, this.ctx.getWebSockets().length - 1) }); }
  async webSocketError() { this.broadcast({ type: 'online', n: Math.max(0, this.ctx.getWebSockets().length - 1) }); }
}


/* ── media library (R2 bucket "bangtaostyle-media", fed by the encrypted media-inbox workflow) ── */
const MEDIA_ROOTS = ['raw/', 'photos/', 'audio/', 'edits/', 'crew/'];
const MEDIA_MAX_UPLOAD = 95 * 1024 * 1024; // Worker request bodies are capped at 100 MB
const TOKEN_TTL = 12 * 3600;

function mediaPath(raw: string): string | null {
  let p: string;
  try { p = decodeURIComponent(raw).replace(/^\/+/, ''); } catch { return null; }
  if (!p || p.length > 300 || p.includes('..') || p.includes('\\') || /[\x00-\x1f]/.test(p)) return null;
  // the ingest private key and the raw index never leave the bucket
  if (!MEDIA_ROOTS.some((r) => p.startsWith(r))) return null;
  return p;
}

async function hmacHex(key: string, msg: string): Promise<string> {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(msg)));
  return [...sig].map((b) => b.toString(16).padStart(2, '0')).join('');
}
async function mediaToken(env: Env): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL;
  return `${exp}.${(await hmacHex(env.CREW_KEY || '', 'media:' + exp)).slice(0, 40)}`;
}
async function mediaTokenOk(env: Env, t: string | null): Promise<boolean> {
  if (!env.CREW_KEY || !t) return false;
  const [exp, sig] = t.split('.');
  if (!exp || !sig || !/^\d+$/.test(exp) || Number(exp) < Date.now() / 1000) return false;
  return safeEqual(sig, (await hmacHex(env.CREW_KEY, 'media:' + exp)).slice(0, 40));
}

interface MediaMeta { path: string; duration?: number | null; size_px?: string | null; added?: string }

async function handleMedia(req: Request, env: Env, url: URL): Promise<Response> {
  if (!env.MEDIA) return bad('media library not configured', 503);
  const p = url.pathname;

  if (p === '/api/media/list' && req.method === 'GET') {
    if (!isCrew(env, req, url)) return bad('crew key required', 401);
    const meta = new Map<string, MediaMeta>();
    try {
      const idx = await env.MEDIA.get('index.json');
      if (idx) for (const f of ((await idx.json()) as { files?: MediaMeta[] }).files || []) meta.set(f.path, f);
    } catch { /* index is optional metadata */ }
    const files: Record<string, unknown>[] = [];
    let cursor: string | undefined;
    for (let page = 0; page < 10; page++) {
      const res = await env.MEDIA.list({ cursor, limit: 1000, include: ['httpMetadata'] });
      for (const o of res.objects) {
        if (!mediaPath(o.key)) continue;
        const m = meta.get(o.key);
        files.push({ path: o.key, size: o.size, uploaded: o.uploaded.toISOString(), type: o.httpMetadata?.contentType || '', duration: m?.duration ?? null, size_px: m?.size_px ?? null });
      }
      if (!res.truncated) break;
      cursor = res.cursor;
    }
    return json({ files, token: await mediaToken(env), ttl: TOKEN_TTL });
  }

  if (p.startsWith('/api/media/file/') && (req.method === 'GET' || req.method === 'HEAD')) {
    if (!(await mediaTokenOk(env, url.searchParams.get('t'))) && !isCrew(env, req, url)) return bad('crew token required', 401);
    const key = mediaPath(p.slice('/api/media/file/'.length));
    if (!key) return bad('bad path', 400);
    const head = await env.MEDIA.head(key);
    if (!head) return bad('not found', 404);
    const size = head.size;
    const h = new Headers({ 'Accept-Ranges': 'bytes', 'Cache-Control': 'private, max-age=3600', ETag: head.httpEtag, 'Content-Type': head.httpMetadata?.contentType || 'application/octet-stream', ...CORS });
    if (url.searchParams.get('dl')) h.set('Content-Disposition', `attachment; filename="${key.split('/').pop()!.replace(/"/g, '')}"`);
    const range = req.headers.get('Range');
    const m = range ? range.match(/^bytes=(\d*)-(\d*)$/) : null;
    if (!m || (m[1] === '' && m[2] === '')) {
      h.set('Content-Length', String(size));
      if (req.method === 'HEAD') return new Response(null, { status: 200, headers: h });
      const obj = await env.MEDIA.get(key);
      return new Response(obj?.body ?? null, { status: obj ? 200 : 404, headers: h });
    }
    let start: number, end: number;
    if (m[1] === '') { start = Math.max(0, size - Number(m[2])); end = size - 1; }
    else { start = Number(m[1]); end = m[2] === '' ? size - 1 : Math.min(Number(m[2]), size - 1); }
    if (start >= size || start > end) { h.set('Content-Range', `bytes */${size}`); return new Response(null, { status: 416, headers: h }); }
    h.set('Content-Range', `bytes ${start}-${end}/${size}`);
    h.set('Content-Length', String(end - start + 1));
    if (req.method === 'HEAD') return new Response(null, { status: 206, headers: h });
    const obj = await env.MEDIA.get(key, { range: { offset: start, length: end - start + 1 } });
    return new Response(obj?.body ?? null, { status: 206, headers: h });
  }

  if (p === '/api/media/upload' && req.method === 'PUT') {
    if (!isCrew(env, req, url)) return bad('crew key required', 401);
    const key = mediaPath(url.searchParams.get('path') || '');
    if (!key || key.endsWith('/')) return bad('path must be under raw/, photos/, audio/, edits/ or crew/', 400);
    const len = Number(req.headers.get('Content-Length') || 0);
    if (!len) return bad('Content-Length required', 411);
    if (len > MEDIA_MAX_UPLOAD) return bad('file too large for the browser upload (max 95 MB) — send it to the chat instead', 413);
    if (!req.body) return bad('empty body', 400);
    const type = req.headers.get('Content-Type') || 'application/octet-stream';
    const put = await env.MEDIA.put(key, req.body, { httpMetadata: { contentType: type } });
    // keep the index in step (best effort; the list endpoint reads R2 directly anyway)
    try {
      const idx = await env.MEDIA.get('index.json');
      const data = idx ? ((await idx.json()) as { files: MediaMeta[] }) : { files: [] };
      data.files = (data.files || []).filter((f) => f.path !== key);
      data.files.push({ path: key, added: new Date().toISOString(), ...({ size: put?.size ?? len, type, by: 'console' } as object) } as MediaMeta);
      await env.MEDIA.put('index.json', JSON.stringify(data, null, 1), { httpMetadata: { contentType: 'application/json' } });
    } catch { /* ignore */ }
    return json({ ok: true, path: key, size: put?.size ?? len });
  }

  return bad('not found', 404);
}
