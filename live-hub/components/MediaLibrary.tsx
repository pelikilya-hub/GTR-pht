'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getCrewKey } from '@/lib/sharedState';

/** Crew console card: the R2 media library (raw footage, photos, tracks, edits) — browse, preview, share, upload. */
interface MFile { path: string; size: number; uploaded: string; type: string; duration: number | null; size_px: string | null }
const FOLDERS: [string, string][] = [['', 'ВСЁ'], ['raw/', 'ИСХОДНИКИ'], ['edits/', 'МОНТАЖ'], ['photos/', 'ФОТО'], ['audio/', 'ТРЕКИ'], ['crew/', 'ОТ ЭКИПАЖА']];
const UP_TO: [string, string][] = [['raw', 'исходник'], ['photos', 'фото'], ['audio', 'трек'], ['edits', 'монтаж'], ['crew', 'экипаж']];

const mb = (b: number) => (b >= 1e9 ? (b / 1e9).toFixed(2) + ' ГБ' : (b / 1e6).toFixed(b >= 1e8 ? 0 : 1) + ' МБ');
const dur = (s: number | null) => (s == null ? '' : `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`);
const kind = (f: MFile) => (f.type.startsWith('video') || /\.(mp4|mov|webm)$/i.test(f.path) ? 'video' : f.type.startsWith('audio') || /\.(mp3|m4a|wav)$/i.test(f.path) ? 'audio' : f.type.startsWith('image') || /\.(jpe?g|png|webp|gif)$/i.test(f.path) ? 'image' : 'file');
const ICON: Record<string, string> = { video: '▶', audio: '♫', image: '◧', file: '▤' };
const today = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10); // ICT date
const slug = (n: string) => n.normalize('NFKD').replace(/[^\w.-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'file';

export function MediaLibrary({ say }: { say: (m: string) => void }) {
  const [files, setFiles] = useState<MFile[] | null>(null);
  const [token, setToken] = useState('');
  const [err, setErr] = useState('');
  const [folder, setFolder] = useState('');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [upTo, setUpTo] = useState('raw');
  const [uploads, setUploads] = useState<{ name: string; pct: number; state: 'up' | 'ok' | 'err' }[]>([]);
  const fileInput = useRef<HTMLInputElement | null>(null);

  const load = useCallback(async () => {
    setErr('');
    const r = await fetch('/api/media/list', { headers: { 'X-Crew-Key': getCrewKey() }, cache: 'no-store' }).catch(() => null);
    if (!r) { setErr('Нет связи с сервером'); return; }
    if (r.status === 401) { setErr('Нужен ключ экипажа (карточка выше)'); setFiles(null); return; }
    if (!r.ok) { setErr('Медиатека недоступна (' + r.status + ')'); return; }
    const d = (await r.json()) as { files: MFile[]; token: string };
    setFiles(d.files); setToken(d.token);
  }, []);
  useEffect(() => { const id = requestAnimationFrame(() => { load(); }); return () => cancelAnimationFrame(id); }, [load]);

  const url = (f: MFile, dl = false) => `/api/media/file/${f.path.split('/').map(encodeURIComponent).join('/')}?t=${token}${dl ? '&dl=1' : ''}`;

  const shown = useMemo(() => (files || [])
    .filter((f) => f.path.startsWith(folder) && (!q || f.path.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => b.uploaded.localeCompare(a.uploaded) || a.path.localeCompare(b.path)), [files, folder, q]);
  const total = useMemo(() => (files || []).reduce((s, f) => s + f.size, 0), [files]);

  const upload = (list: FileList | null) => {
    if (!list?.length) return;
    [...list].forEach((file) => {
      const ext = (file.name.match(/\.[^.]+$/) || [''])[0].toLowerCase();
      const base = slug(file.name.replace(/\.[^.]+$/, ''));
      const dest = ['audio'].includes(upTo) ? `${upTo}/${base}${ext}` : `${upTo}/${today()}/${base}${ext}`;
      if (file.size > 95 * 1024 * 1024) { say('✗ ' + file.name + ': больше 95 МБ — кинь в чат, положу в медиатеку'); return; }
      setUploads((u) => [...u, { name: file.name, pct: 0, state: 'up' }]);
      const set = (patch: Partial<{ pct: number; state: 'up' | 'ok' | 'err' }>) => setUploads((u) => u.map((x) => (x.name === file.name ? { ...x, ...patch } : x)));
      const x = new XMLHttpRequest();
      x.open('PUT', '/api/media/upload?path=' + encodeURIComponent(dest));
      x.setRequestHeader('X-Crew-Key', getCrewKey());
      x.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
      x.upload.onprogress = (e) => { if (e.lengthComputable) set({ pct: Math.round((e.loaded / e.total) * 100) }); };
      x.onload = () => { if (x.status === 200) { set({ pct: 100, state: 'ok' }); load(); } else { set({ state: 'err' }); say('✗ ' + file.name + ': ' + x.status); } };
      x.onerror = () => { set({ state: 'err' }); say('✗ ' + file.name + ': нет связи'); };
      x.send(file);
    });
    if (fileInput.current) fileInput.current.value = '';
  };

  const copy = (f: MFile) => {
    const link = location.origin + url(f);
    navigator.clipboard?.writeText(link).then(() => say('✓ Ссылка скопирована · живёт 12 ч'), () => say(link));
  };

  return (
    <section className="panel media-lib" style={{ padding: 22, gridColumn: '1 / -1' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div className="kicker" style={{ fontSize: 10 }}>МЕДИАТЕКА · R2</div>
        {files && <span className="meta">{files.length} файлов · {mb(total)}</span>}
        <span style={{ flex: 1 }} />
        <button className="btn btn-sm" onClick={load}>ОБНОВИТЬ</button>
      </div>

      {err ? <div className="meta" style={{ marginTop: 14, color: 'var(--red-2)' }}>{err}</div> : !files ? <div className="meta" style={{ marginTop: 14 }}>загрузка…</div> : (
        <>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16, alignItems: 'center' }}>
            <div className="seg" style={{ flexWrap: 'wrap' }}>
              {FOLDERS.map(([k, l]) => <button key={k} className={folder === k ? 'on' : ''} onClick={() => setFolder(k)}>{l}</button>)}
            </div>
            <input className="field" style={{ flex: '1 1 180px', height: 40 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="поиск" autoCapitalize="none" />
          </div>

          <div className="ml-up">
            <span className="meta">ЗАГРУЗИТЬ КАК</span>
            <select className="field" style={{ height: 40, width: 'auto' }} value={upTo} onChange={(e) => setUpTo(e.target.value)}>
              {UP_TO.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
            <button className="btn btn-red btn-sm" onClick={() => fileInput.current?.click()}>＋ ФАЙЛЫ</button>
            <input ref={fileInput} type="file" multiple accept="video/*,image/*,audio/*,.zip" hidden onChange={(e) => upload(e.target.files)} />
            <span className="meta" style={{ textTransform: 'none', letterSpacing: '.04em' }}>до 95 МБ с телефона; больше — в чат</span>
          </div>
          {uploads.length > 0 && (
            <div style={{ display: 'grid', gap: 6, marginTop: 10 }}>
              {uploads.map((u) => (
                <div key={u.name} className="ml-prog">
                  <span>{u.name}</span>
                  <div className="bar" style={{ height: 3 }}><i style={{ width: u.pct + '%', background: u.state === 'err' ? 'var(--ink-3)' : undefined }} /></div>
                  <span className="meta">{u.state === 'ok' ? '✓' : u.state === 'err' ? '✗' : u.pct + '%'}</span>
                </div>
              ))}
            </div>
          )}

          <div className="ml-list">
            {shown.length === 0 && <div className="meta" style={{ padding: '16px 0' }}>пусто</div>}
            {shown.map((f) => {
              const k = kind(f), name = f.path.split('/').pop()!, dir = f.path.slice(0, f.path.length - name.length);
              const nsfw = /uncensored|18\+/i.test(f.path);
              return (
                <div key={f.path} className={'ml-row' + (open === f.path ? ' open' : '')}>
                  <button className="ml-main" onClick={() => setOpen(open === f.path ? null : f.path)} aria-expanded={open === f.path}>
                    <span className="ml-ic">{ICON[k]}</span>
                    <span className="ml-name"><b>{name}</b><span className="meta">{dir}</span></span>
                    {nsfw && <span className="chip" style={{ height: 22, color: 'var(--red-2)' }}>18+</span>}
                    <span className="meta ml-info">{[f.size_px, dur(f.duration), mb(f.size)].filter(Boolean).join(' · ')}</span>
                  </button>
                  {open === f.path && (
                    <div className="ml-view">
                      {k === 'video' && <video src={url(f)} controls playsInline preload="metadata" />}
                      {k === 'audio' && <audio src={url(f)} controls preload="metadata" />}
                      {k === 'image' && <img src={url(f)} alt={name} />}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <a className="btn btn-sm" href={url(f, true)}>⬇ СКАЧАТЬ</a>
                        <button className="btn btn-sm" onClick={() => copy(f)}>🔗 ССЫЛКА НА 12 Ч</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
