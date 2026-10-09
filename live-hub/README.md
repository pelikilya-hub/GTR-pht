# GTR|PHT Live Hub — deploy & ops

Next.js 16 static export + one Cloudflare Worker (static assets, `/api/*`, Durable-Object room
signaling, Cloudflare Realtime SFU proxy). One dashboard project, one domain: **bangtaostyle.com**.

## Local

```bash
npm install
npm run dev            # Next dev server (UI only, no Worker routes)
npm run build          # → ./out (static export)
npm run cf:dev         # Worker + assets + DO locally on http://localhost:8787
npm run typecheck:worker
npm run lint
```

Binary assets (not in git, drop them in before building): `public/assets/{ilia,places,audio,scales}` —
see `public/assets/README.md`.

## Production — Cloudflare Workers Builds (git-connected, no CLI needed)

1. **Cloudflare dashboard → Workers & Pages → Create → Workers → Import a repository**
   - Repository: `pelikilya-hub/gtr-pht`, branch: `main` (or the PR branch while testing)
   - **Root directory:** `live-hub`
   - **Build command:** `npm run build`
   - **Deploy command:** `npx wrangler deploy`
   - Project name: `gtrpht-live-hub` (must match `name` in `wrangler.jsonc`)
2. **Settings → Variables & Secrets** — add as *Secrets*:

   | Secret | Where to get it |
   |---|---|
   | `REALTIME_APP_ID`, `REALTIME_APP_SECRET` | Dashboard → Realtime → **SFU** → Create app |
   | `TURN_KEY_ID`, `TURN_KEY_TOKEN` | Dashboard → Realtime → **TURN** → Create key (recommended; without it clients fall back to STUN-only) |
   | `MAKE_WEBHOOK_URL` | Make.com → scenario → Custom Webhook URL (event relay for donations / votes / invites) |

   Plain var (already in `wrangler.jsonc`): `ALLOWED_ROOMS=gtrpht` (comma-separated room allowlist).
3. **Settings → Domains & Routes → Add → Custom domain → `bangtaostyle.com`** (and `www.bangtaostyle.com`
   if wanted). The zone is already on Cloudflare, so the DNS record + certificate are created automatically.
4. Push to the connected branch → Workers Builds runs `npm run build` + `wrangler deploy`.
   First deploy also applies the Durable Object migration (`RoomSignal`).

Health check once live: `https://bangtaostyle.com/api/health` → `{"ok":true,"sfu":true,"turn":true,"hook":true}`.

## Pages

| Path | Who | What |
|---|---|---|
| `/` | public | the Live Hub (map, telemetry, stream, scales, …). *GTR CAM · LIVE* tab = multiview of the room |
| `/camera` | crew (iPhone) | transmitter: pick slot CAM 1–4 → **В ЭФИР** → publishes to the SFU |
| `/pult` | director (iPad/Mac) | all cameras, program window, tally, flip / quality / mic commands |

## Realtime architecture

```
iPhone /camera ──WebRTC──▶ Cloudflare Realtime SFU ◀──WebRTC── /pult, hub viewers (N)
      │                                                              │
      └────────── WebSocket /ws/gtrpht (Durable Object) ─────────────┘
                 presence · track announcements · tally · commands
```

- Media never goes peer-to-peer: one upload from the phone, any number of viewers pull from the SFU.
- The SFU App Secret and TURN key live only in the Worker (`/api/rt/*`, `/api/turn`).
- Room signaling is a hibernating Durable Object — idle rooms cost nothing. A slot is exclusive;
  a reconnecting phone takes its slot back automatically.

## Known upstream quirk (inherited from the design file)

Stage boundaries in `lib/i18n.ts` (`STAGE_DEFS` `s`/`e`) still carry the pre-shift July dates for
stages 1–3 while their display text says August — kept as-is for fidelity, flagged for the owner.
