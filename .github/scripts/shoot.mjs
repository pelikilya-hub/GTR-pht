import { chromium } from 'playwright';
import fs from 'fs';
const url = 'https://bangtaostyle.com/';
const out = '_shots'; fs.mkdirSync(out, { recursive: true });
const log = [];
const flush = () => fs.writeFileSync(`${out}/log.txt`, log.join('\n') + '\n');
process.on('uncaughtException', (e) => { log.push('FATAL ' + e.stack); flush(); process.exit(0); });
process.on('unhandledRejection', (e) => { log.push('REJECT ' + (e && e.stack || e)); flush(); process.exit(0); });
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
for (const [n, vp, mob] of [['iphone', { width: 390, height: 844 }, true], ['desktop', { width: 1440, height: 900 }, false]]) {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: mob ? 2 : 1, isMobile: mob, hasTouch: mob, locale: 'ru-RU' });
  const p = await ctx.newPage();
  p.on('console', (m) => { if (m.type() === 'error') log.push(`[${n}] console.error: ${m.text().slice(0, 240)}`); });
  p.on('pageerror', (e) => log.push(`[${n}] pageerror: ${e.message}`));
  p.on('response', (r) => { if (r.status() >= 400) log.push(`[${n}] HTTP ${r.status()}: ${r.url()}`); });
  await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch((e) => log.push(`[${n}] goto: ${e.message}`));
  await p.waitForTimeout(4000);
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  let i = 0;
  for (let y = 0; y < H && i < 16; y += vp.height * 0.85, i++) {
    try {
      await p.evaluate((yy) => window.scrollTo(0, yy), y);
      await p.waitForTimeout(y === 0 ? 500 : 1300);
      await p.screenshot({ path: `${out}/${n}-${String(i).padStart(2, '0')}.png`, timeout: 20000 });
    } catch (e) { log.push(`[${n}] shot ${i} failed: ${e.message.slice(0, 300)}`); flush(); }
  }
  await p.evaluate(() => document.getElementById('route')?.scrollIntoView());
  await p.waitForTimeout(7000);
  try { const map = await p.$('.map-shell'); if (map) await map.screenshot({ path: `${out}/${n}-map.png`, timeout: 20000 }); } catch (e) { log.push(`[${n}] map shot failed: ${e.message.slice(0, 300)}`); }
  const info = await p.evaluate(() => ({ title: document.title, font: document.fonts.check("800 40px 'Inter Tight'"), canvas: !!document.querySelector('.maplibregl-canvas'), hidden: document.querySelectorAll('.rv:not(.in)').length }));
  log.push(`[${n}] info: ${JSON.stringify(info)}`); flush();
  await ctx.close();
}
await b.close();
fs.writeFileSync(`${out}/log.txt`, log.join('\n') + '\n');
console.log(log.join('\n'));
