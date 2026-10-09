import { chromium } from 'playwright';
import fs from 'fs';
const url = process.env.URL || 'https://bangtaostyle.com/';
const out = '_shots'; fs.mkdirSync(out, { recursive: true });
const log = [];
const b = await chromium.launch();
for (const [n, vp, mobile] of [['iphone', { width: 390, height: 844 }, true], ['desktop', { width: 1440, height: 900 }, false]]) {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile, locale: 'ru-RU' });
  const p = await ctx.newPage();
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) log.push(`[${n}] console.${m.type()}: ${m.text()}`); });
  p.on('pageerror', (e) => log.push(`[${n}] pageerror: ${e.message}`));
  p.on('requestfailed', (r) => log.push(`[${n}] requestfailed: ${r.url()} ${r.failure()?.errorText}`));
  p.on('response', (r) => { if (r.status() >= 400) log.push(`[${n}] HTTP ${r.status()}: ${r.url()}`); });
  await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch((e) => log.push(`[${n}] goto: ${e.message}`));
  await p.waitForTimeout(6000);
  await p.screenshot({ path: `${out}/${n}-top.png` });
  await p.screenshot({ path: `${out}/${n}-full.png`, fullPage: true });
  const map = await p.$('.leaflet-container, .maplibregl-map');
  if (map) { await map.scrollIntoViewIfNeeded(); await p.waitForTimeout(3000); await map.screenshot({ path: `${out}/${n}-map.png` }); }
  const info = await p.evaluate(() => ({ title: document.title, tiles: document.querySelectorAll('.leaflet-tile-loaded').length, canvases: document.querySelectorAll('canvas').length, deity: !!customElements.get('gtr-deity') }));
  log.push(`[${n}] info: ${JSON.stringify(info)}`);
  await ctx.close();
}
await b.close();
fs.writeFileSync(`${out}/log.txt`, log.join('\n') + '\n');
console.log(log.join('\n'));
