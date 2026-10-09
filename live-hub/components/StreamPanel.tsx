'use client';
import { useState } from 'react';
import { useHub } from '@/lib/HubContext';
import { setLs, ls } from '@/lib/storage';

interface Channels { [k: string]: string }

const PDEFS: [string, string, string][] = [
  ['twitch', 'TWITCH', 'gtrpht'],
  ['youtube', 'YOUTUBE', 'UC… или ID видео'],
  ['kick', 'KICK', 'gtrpht'],
  ['vk', 'VK LIVE', 'video-1_2 или страница'],
  ['telegram', 'TELEGRAM', '@gtrpht'],
  ['tiktok', 'TIKTOK', '@gtrpht'],
];

function chLink(k: string, val: string): string {
  if (!val) return '#';
  switch (k) {
    case 'twitch': return 'https://twitch.tv/' + val;
    case 'youtube': return val.indexOf('UC') === 0 ? 'https://www.youtube.com/channel/' + val + '/live' : 'https://www.youtube.com/watch?v=' + val;
    case 'kick': return 'https://kick.com/' + val;
    case 'vk': return 'https://vk.com/' + val.replace(/^@/, '');
    case 'telegram': return 'https://t.me/' + val.replace(/^@/, '');
    default: return 'https://www.tiktok.com/@' + val.replace(/^@/, '') + '/live';
  }
}

export function StreamPanel() {
  const { t, lang, journey, notify, bump } = useHub();
  const ru = lang === 'ru';
  const [platTab, setPlatTab] = useState('twitch');
  const [chOpen, setChOpen] = useState(false);
  const [chDraft, setChDraft] = useState<Channels | null>(null);
  const ch = ls<Channels>('gtrpht_channels', {});
  const hostn = typeof location !== 'undefined' ? location.hostname : 'localhost';

  const chv = (ch[platTab] || '').trim();
  let embMode: 'iframe' | 'link' | 'empty' | 'cam' = 'empty';
  let embSrc = '', embHref = '';
  if (platTab === 'gtrcam') embMode = 'cam';
  else if (chv) {
    if (platTab === 'twitch') { embMode = 'iframe'; embSrc = `https://player.twitch.tv/?channel=${encodeURIComponent(chv)}&parent=${hostn}&muted=true`; }
    else if (platTab === 'youtube') { embMode = 'iframe'; embSrc = chv.indexOf('UC') === 0 ? `https://www.youtube.com/embed/live_stream?channel=${chv}` : `https://www.youtube.com/embed/${chv}`; }
    else if (platTab === 'kick') { embMode = 'iframe'; embSrc = `https://player.kick.com/${encodeURIComponent(chv)}?muted=true`; }
    else if (platTab === 'vk') {
      const m = chv.match(/(-?\d+)_(\d+)/);
      if (m) { embMode = 'iframe'; embSrc = `https://vk.com/video_ext.php?oid=${m[1]}&id=${m[2]}&hd=2`; }
      else { embMode = 'link'; embHref = 'https://vk.com/' + chv.replace(/^@/, ''); }
    } else if (platTab === 'telegram') { embMode = 'link'; embHref = 'https://t.me/' + chv.replace(/^@/, ''); }
    else { embMode = 'link'; embHref = 'https://www.tiktok.com/@' + chv.replace(/^@/, '') + '/live'; }
  }

  const chDraftV = chDraft || ch;
  const saveChannels = () => { setLs('gtrpht_channels', chDraftV); setChOpen(false); setChDraft(null); bump(); notify(t.chToast); };

  const share = (() => {
    const u = typeof location !== 'undefined' ? location.href.split('#')[0] : '';
    const txt = ru ? 'GTR|PHT — 39 дней Таиланда в прямом эфире' : 'GTR|PHT — 39 days of Thailand, live';
    const op = (h: string) => { try { window.open(h, '_blank'); } catch { /* ignore */ } };
    return [
      { n: 'COPY LINK', go: () => { try { navigator.clipboard.writeText(u).then(() => notify(t.toastCopied)).catch(() => notify(u)); } catch { notify(u); } } },
      { n: 'TELEGRAM', go: () => op('https://t.me/share/url?url=' + encodeURIComponent(u) + '&text=' + encodeURIComponent(txt)) },
      { n: 'WHATSAPP', go: () => op('https://wa.me/?text=' + encodeURIComponent(txt + ' ' + u)) },
      { n: 'VK', go: () => op('https://vk.com/share.php?url=' + encodeURIComponent(u)) },
    ];
  })();

  const tabBtn = (k: string, n: string) => (
    <button key={k} onClick={() => setPlatTab(k)} style={{ background: k === platTab ? '#E5372C' : 'none', border: `1px solid ${k === platTab ? '#E5372C' : '#2A2A30'}`, color: k === platTab ? '#0B0B0C' : '#8E8C94', fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, letterSpacing: '.14em', padding: '7px 11px', cursor: 'pointer' }}>{n}</button>
  );

  return (
    <div id="stream" data-screen-label="stream" style={{ border: '1px solid #26262B', background: '#101013', padding: 22, position: 'relative' }}>
      <div style={{ position: 'absolute', top: -1, right: -1, width: 14, height: 14, borderTop: '2px solid #E5372C', borderRight: '2px solid #E5372C' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, letterSpacing: '.22em', color: '#8E8C94', flex: 1 }}>{t.streamTitle}</div>
        {journey.isJourney && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, border: '1px solid #E5372C', padding: '4px 10px' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#FF4B3E', animation: 'omBlink 1.1s infinite' }} />
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '.18em', color: '#FF6A5B' }}>{t.liveNow}</span>
          </div>
        )}
      </div>

      <div className="platform-tabs" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 16 }}>
        {PDEFS.map(([k, n]) => tabBtn(k, n))}
        {tabBtn('gtrcam', 'GTR CAM · LIVE')}
      </div>

      {embMode === 'cam' && (
        <div style={{ marginTop: 10, background: '#0A0A0B', border: '1px solid #1E1E23', padding: 10 }}>
          <gtr-multiview room="gtrpht" />
        </div>
      )}

      {embMode !== 'cam' && (
        <div style={{ marginTop: 10, aspectRatio: '16/9', background: '#0A0A0B', border: '1px solid #1E1E23', position: 'relative', overflow: 'hidden' }}>
          {embMode === 'iframe' && (
            <iframe src={embSrc} title="live player" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowFullScreen />
          )}
          {embMode === 'link' && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '0 24px', textAlign: 'center' }}>
              <div style={{ position: 'absolute', left: 0, right: 0, height: '44%', background: 'linear-gradient(180deg,transparent,rgba(229,55,44,.05),transparent)', animation: 'omScan 4.5s linear infinite' }} />
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, letterSpacing: '.1em', lineHeight: 1.7, color: '#6E6C74' }}>{t.chLinkNote}</div>
              <a href={embHref} target="_blank" rel="noreferrer" style={{ border: '1px solid #E5372C', color: '#FF6A5B', fontFamily: "'JetBrains Mono',monospace", fontSize: 11, letterSpacing: '.14em', padding: '12px 18px' }}>{t.chWatchBtn}</a>
            </div>
          )}
          {embMode === 'empty' && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '0 24px', textAlign: 'center' }}>
              <div style={{ position: 'absolute', left: 0, right: 0, height: '44%', background: 'linear-gradient(180deg,transparent,rgba(229,55,44,.05),transparent)', animation: 'omScan 4.5s linear infinite' }} />
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, letterSpacing: '.26em', color: '#E5372C', animation: 'omBlink 2.2s infinite' }}>{journey.isJourney ? '● LIVE SIGNAL' : t.standby}</div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, letterSpacing: '.1em', lineHeight: 1.7, color: '#6E6C74' }}>{t.chEmptyNote}</div>
            </div>
          )}
        </div>
      )}

      <button onClick={() => setChOpen((v) => !v)} style={{ marginTop: 12, background: 'none', border: '1px solid #2A2A30', color: '#8E8C94', fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, letterSpacing: '.16em', padding: '8px 12px', cursor: 'pointer' }}>{t.chOpenLbl}</button>

      {chOpen && (
        <div style={{ border: '1px solid #26262B', background: '#0D0D0F', padding: 16, marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, letterSpacing: '.22em', color: '#55545C' }}>{t.chTitle} — {t.chHint}</div>
          {PDEFS.map(([k, n, ph]) => (
            <div key={k} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '.14em', color: '#8E8C94', width: 74, flex: 'none' }}>{n}</span>
              <input value={chDraftV[k] || ''} onChange={(e) => setChDraft({ ...chDraftV, [k]: e.target.value })} placeholder={ph} style={{ flex: 1, background: '#101013', border: '1px solid #26262B', color: '#ECE9E4', padding: '8px 10px', fontSize: 12, fontFamily: "'JetBrains Mono',monospace", outline: 'none', minWidth: 0 }} />
            </div>
          ))}
          <button onClick={saveChannels} style={{ background: '#E5372C', border: 'none', color: '#0D0D0F', fontFamily: "'Unbounded',sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: '.08em', padding: 11, cursor: 'pointer' }}>{t.chSave}</button>
        </div>
      )}

      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, letterSpacing: '.2em', color: '#55545C', marginTop: 18 }}>{t.watchOn}</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        {PDEFS.map(([k, n]) => (
          <a key={k} href={chLink(k, (ch[k] || '').trim())} style={{ border: '1px solid #2A2A30', padding: '8px 13px', fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, letterSpacing: '.08em', color: '#B9B6BE' }}>{n}</a>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, letterSpacing: '.2em', color: '#55545C' }}>{t.shareLbl}</span>
        {share.map((sb) => (
          <button key={sb.n} onClick={sb.go} style={{ background: 'none', border: '1px solid #2A2A30', color: '#8E8C94', fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, letterSpacing: '.12em', padding: '7px 11px', cursor: 'pointer' }}>{sb.n}</button>
        ))}
      </div>

      <div style={{ borderTop: '1px solid #1E1E23', marginTop: 18, paddingTop: 14 }}>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, letterSpacing: '.2em', color: '#55545C' }}>{t.schedTitle}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
          {t.sched.map((row) => (
            <div key={row[0]} style={{ display: 'flex', gap: 14, alignItems: 'baseline' }}><span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#E5372C' }}>{row[0]}</span><span style={{ fontSize: 13.5, color: '#A8A6AD' }}>{row[1]}</span></div>
          ))}
        </div>
      </div>
    </div>
  );
}
