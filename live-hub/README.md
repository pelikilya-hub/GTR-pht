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

Binary assets go in `public/assets/{ilia,places,audio,scales}` and **must be committed** (Cloudflare builds
from git) — see `public/assets/README.md`.

## Production — GitHub Actions → `wrangler deploy` (default path)

`.github/workflows/deploy-live-hub.yml` builds and deploys on every push to the default branch that touches
`live-hub/`. The custom domains `bangtaostyle.com` + `www.bangtaostyle.com` are declared in `wrangler.jsonc`
(`routes[].custom_domain`), so the deploy creates DNS + certificate itself — nothing to click in the dashboard.

1. **Cloudflare → My Profile → API Tokens → Create Token → "Edit Cloudflare Workers" template**, and add
   `Zone → DNS → Edit` for `bangtaostyle.com` (needed once for the custom domain records).
2. **GitHub → repo → Settings → Secrets and variables → Actions → New repository secret:**

   | Secret | Where to get it |
   |---|---|
   | `CLOUDFLARE_API_TOKEN` | the token from step 1 |
   | `CLOUDFLARE_ACCOUNT_ID` | Cloudflare → Workers & Pages → right sidebar *Account ID* |
   | `REALTIME_APP_ID`, `REALTIME_APP_SECRET` | Cloudflare → Realtime → **SFU** → Create app |
   | `TURN_KEY_ID`, `TURN_KEY_TOKEN` | Cloudflare → Realtime → **TURN** → Create key (recommended; without it clients fall back to STUN-only) |
   | `MAKE_WEBHOOK_URL` | Make.com → scenario → Custom Webhook URL (event relay for donations / votes / invites) |
   | `CREW_KEY` | any long passphrase you choose — the crew types it once per device on `/camera`, `/pult` and in the channel editor |

   The Realtime/Make/crew values are uploaded to the Worker as secrets after each deploy (`wrangler secret bulk`);
   missing ones are skipped with a warning. Plain var (in `wrangler.jsonc`): `ALLOWED_ROOMS=gtrpht`.
3. Push to the default branch (or **Actions → Deploy Live Hub → Run workflow**). Without the two Cloudflare
   secrets the workflow only builds and typechecks; with them it deploys, uploads secrets and curls `/api/health`.
   First deploy also applies the Durable Object migration (`RoomSignal`).

Health check once live: `https://bangtaostyle.com/api/health` → `{"ok":true,"sfu":true,"turn":true,"hook":true,"crew":true}`.

### Alternative — Cloudflare Workers Builds (git-connected)

Dashboard → Workers & Pages → Create → Workers → Import a repository → `pelikilya-hub/GTR-pht`,
root directory `live-hub`, build `npm run build`, deploy `npx wrangler deploy`, project name `gtrpht-live-hub`.
Secrets then go to the Worker's *Settings → Variables & Secrets*. Both paths deploy the same Worker; use one.

## Shared state & crew key

Everything the crew configures for all visitors lives in the `HubState` Durable Object:
stream channels, pay / GPS URLs, last position, crew status, logbook. Browsers pull `/api/state` on load,
every 20 s and when the tab regains focus.

- **Channel editor** (stream block → «НАСТРОИТЬ КАНАЛЫ»): channels + pay URL + GPS URL + crew key → saved for everyone.
- **GPS push**: point OwnTracks (HTTP mode) or any tracker at `https://bangtaostyle.com/api/pos?key=<CREW_KEY>`;
  accepts `{lat,lng,ts}` or OwnTracks `{_type:"location",lat,lon,tst}`.
- **Crew status / logbook** (no UI yet): `PUT /api/state` with header `X-Crew-Key`, e.g.
  `{"status":{"code":"drive","by":"ilia"}}` or `{"posts":[{"member":"ilia","type":"post","text":"…"}]}`.
- `CREW_KEY` also gates camera/pult roles in the room and publishing to the SFU, so a visitor cannot hijack a camera slot.
  Viewers (multiview) never need it.

## Assets

| Path | Source |
|---|---|
| `assets/scales/themis.png` | extracted from the Claude Design bundle |
| `assets/places/**.jpg` | Wikimedia Commons, free licenses — authors on `/credits/` (`lib/photoCredits.json`) |
| `assets/audio/night-drive.mp3` | synthesized fallback loop; drop the real `midnight-circuit.mp3` next to it and the player uses it automatically |
| `assets/ilia/night-lounge-graded.png` | **missing** — crew portrait from the design, add it to show the photo on the crew card |

## Pages

| Path | Who | What |
|---|---|---|
| `/` | public | the Live Hub (map, telemetry, stream, scales, …). *GTR CAM · LIVE* tab = multiview of the room |
| `/camera` | crew (iPhone) | transmitter: pick slot CAM 1–4 → **В ЭФИР** → publishes to the SFU |
| `/pult` | director (iPad/Mac) | all cameras, program window, tally, flip / quality / mic commands |
| `/credits` | public | photo attributions |

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
