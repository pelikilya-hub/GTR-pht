// Client-side event dispatch. Events go to the site's own Worker (`/api/hook`),
// which relays them server-side to the Make.com webhook stored as a Worker
// secret — so no third-party endpoint is baked into the browser bundle.
// NEXT_PUBLIC_HOOK_URL can override the relay path (e.g. a direct Make URL
// for local dev). Leave both unset and the UI still works; events just drop.
export type HubWebhookEvent =
  | 'scales_donate'
  | 'scales_vote'
  | 'boost_donate'
  | 'invite_submit'
  | 'city_donate'
  | 'car_tip';

export interface HubWebhookPayload {
  [key: string]: unknown;
}

function hookUrl(): string | null {
  const override = process.env.NEXT_PUBLIC_HOOK_URL;
  if (override && override.trim()) return override.trim();
  if (typeof location === 'undefined') return null;
  return '/api/hook';
}

export async function fireWebhook(event: HubWebhookEvent, payload: HubWebhookPayload = {}): Promise<void> {
  const url = hookUrl();
  if (!url) return;
  const body = JSON.stringify({
    source: 'gtrpht-live-hub',
    event,
    ts: Date.now(),
    page: typeof location !== 'undefined' ? location.href : '',
    ...payload,
  });
  try {
    await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true });
  } catch {
    try {
      await fetch(url, { method: 'POST', mode: 'no-cors', body, keepalive: true });
    } catch {
      /* best-effort — never block the UI action on a failed webhook */
    }
  }
}
