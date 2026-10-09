// Builds public/assets/audio/tracks.json from every .mp3/.m4a in that folder.
// Upload a file → next build picks it up. The synthesized fallback loop always goes last.
import fs from 'node:fs';
import path from 'node:path';

const dir = path.join(process.cwd(), 'public/assets/audio');
const FALLBACK = 'night-drive.mp3';
const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /\.(mp3|m4a|aac|ogg)$/i.test(f)) : [];
const title = (f) => f.replace(/\.[^.]+$/, '').replace(/^\d+[\s._-]*/, '').replace(/[_-]+/g, ' ').trim().toUpperCase() || f;
const own = files.filter((f) => f !== FALLBACK).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
const list = [...own, ...(files.includes(FALLBACK) ? [FALLBACK] : [])].map((f) => ({ title: title(f), src: '/assets/audio/' + encodeURIComponent(f) }));
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'tracks.json'), JSON.stringify(list, null, 1) + '\n');
console.log(`tracks.json: ${list.length} track(s) — ${list.map((t) => t.title).join(', ')}`);
