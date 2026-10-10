// Production player probe: range support, media playback in Chrome (H.264) and WebKit, page errors.
import { chromium, webkit } from 'playwright';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
const BASE = 'https://bangtaostyle.com';
const out = { ranges: {}, browsers: {} };
for (const p of ['/assets/audio/01-gtr-phuket-bangtao-style.mp3', '/assets/video/v-walk-slow.mp4', '/assets/video/g-smoke.mp4', '/assets/video/car-2.mp4']) {
  try { out.ranges[p] = execSync(`curl -sS -o /dev/null -D - -H "Range: bytes=1000-1999" ${BASE}${p} | grep -iE "^HTTP|content-range|accept-ranges|content-length|content-type|cache-control"`).toString().trim().split('\n'); }
  catch (e) { out.ranges[p] = String(e).slice(0, 200); }
}
try { out.state = JSON.parse(execSync(`curl -sS ${BASE}/api/state`).toString()); delete out.state.posts; } catch (e) { out.state = String(e).slice(0, 200); }
const runs = [['chrome', () => chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--autoplay-policy=no-user-gesture-required'] })],
              ['webkit', () => webkit.launch()]];
for (const [name, launch] of runs) {
  const r = { errors: [], failed: [] };
  try {
    const b = await launch();
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: name !== 'chrome' ? false : true, hasTouch: true });
    const pg = await ctx.newPage();
    pg.on('pageerror', (e) => r.errors.push(e.message.slice(0, 200)));
    pg.on('console', (m) => { if (m.type() === 'error') r.errors.push(m.text().slice(0, 200)); });
    pg.on('requestfailed', (q) => r.failed.push(q.url().slice(0, 120) + ' ' + q.failure()?.errorText));
    await pg.goto(BASE + '/', { waitUntil: 'load', timeout: 60000 });
    await pg.waitForTimeout(6000);
    r.reel = await pg.evaluate(() => [...document.querySelectorAll('video.reel-layer')].map((v) => ({ src: v.currentSrc.split('/').pop(), rs: v.readyState, paused: v.paused, t: +v.currentTime.toFixed(2), err: v.error?.code ?? null, rate: v.playbackRate })));
    r.canH264 = await pg.evaluate(() => document.createElement('video').canPlayType('video/mp4; codecs="avc1.640028"'));
    // music: start, wait, seek
    r.audio = await pg.evaluate(async () => {
      const a = window.__gtrAudio; if (!a) return 'no __gtrAudio';
      const res = {};
      try { await a.play(); res.play = 'ok'; } catch (e) { res.play = String(e).slice(0, 120); }
      await new Promise((ok) => setTimeout(ok, 3000));
      res.t1 = +a.currentTime.toFixed(2); res.paused = a.paused; res.dur = a.duration; res.err = a.error?.code ?? null; res.src = a.currentSrc.split('/').pop();
      a.currentTime = 120; await new Promise((ok) => setTimeout(ok, 2500));
      res.afterSeek = +a.currentTime.toFixed(2); res.buffered = a.buffered.length ? [a.buffered.start(0), a.buffered.end(a.buffered.length - 1)].map((x) => +x.toFixed(1)) : [];
      return res;
    });
    await pg.waitForTimeout(4000);
    r.reelAfter = await pg.evaluate(() => ({ shot: document.querySelector('.reel-hud .shot')?.textContent, cls: document.querySelector('.reel')?.className, vids: [...document.querySelectorAll('video.reel-layer')].map((v) => ({ src: v.currentSrc.split('/').pop(), rs: v.readyState, paused: v.paused, t: +v.currentTime.toFixed(2), err: v.error?.code ?? null, rate: +v.playbackRate.toFixed(2) })) }));
    r.iframes = await pg.evaluate(() => [...document.querySelectorAll('iframe')].map((f) => f.src.slice(0, 120)));
    await b.close();
  } catch (e) { r.fatal = String(e).slice(0, 300); }
  out.browsers[name] = r;
}
fs.mkdirSync('_probe', { recursive: true });
fs.writeFileSync('_probe/player.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
