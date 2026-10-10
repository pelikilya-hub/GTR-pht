// Production checks without secrets: media API wiring (401 = bound + protected, 503 = no R2 binding).
import { execSync } from 'node:child_process';
import fs from 'node:fs';
const B = 'https://bangtaostyle.com';
const code = (args) => execSync(`curl -s -o /dev/null -w "%{http_code}" ${args}`).toString();
const out = {
  list_no_key: code(`${B}/api/media/list`),
  file_bad_token: code(`"${B}/api/media/file/raw/x.mp4?t=1.abc"`),
  keys_path: code(`"${B}/api/media/file/_keys/ingest-private.pem?t=1.abc"`),
  health: execSync(`curl -s ${B}/api/health`).toString(),
  home: code(`${B}/`), console: code(`${B}/console/`),
};
fs.mkdirSync('_probe', { recursive: true }); fs.writeFileSync('_probe/media.json', JSON.stringify(out, null, 1)); console.log(out);
