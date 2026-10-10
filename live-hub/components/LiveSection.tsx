'use client';
import { useState } from 'react';
import { Chat } from './Chat';
import { BoostPanel } from './BoostPanel';
import { SectionHead } from './ui/Motion';
import { useHub } from '@/lib/HubContext';
import { ls } from '@/lib/storage';
import { getCrewKey, pushShared, setCrewKey } from '@/lib/sharedState';

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

export function LiveSection() {
  const { t, lang, journey, notify, bump, integrations } = useHub();
  const ru = lang === 'ru';
  const [platTab, setPlatTab] = useState('twitch');
  // The embed (Twitch / YouTube / Kick / VK) is a heavy page of its own: before the stream it only
  // loads on request, during the stream it loads by itself. Switching platform re-arms it.
  const [armedFor, setArmedFor] = useState<string | null>(null);
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
  const [intDraft, setIntDraft] = useState<{ payUrl: string; posUrl: string } | null>(null);
  const intV = intDraft || { payUrl: integrations.payUrl || '', posUrl: integrations.posUrl || '' };
  const [keyDraft, setKeyDraft] = useState<string | null>(null);
  const keyV = keyDraft ?? (chOpen ? getCrewKey() : '');
  const [saving, setSaving] = useState(false);
  const saveChannels = async () => {
    const bad = [intV.payUrl, intV.posUrl].some((u) => u && !/^https:\/\//i.test(u.trim()));
    if (bad) { notify(ru ? 'Ссылки оплаты и GPS должны начинаться с https://' : 'Pay and GPS links must start with https://'); return; }
    setCrewKey(keyV);
    setSaving(true);
    const res = await pushShared({ channels: chDraftV, integrations: { payUrl: intV.payUrl.trim(), posUrl: intV.posUrl.trim() } });
    setSaving(false);
    bump();
    if (res === 'ok') { setChOpen(false); setChDraft(null); setIntDraft(null); setKeyDraft(null); notify(ru ? 'Сохранено для всех зрителей' : 'Saved for every viewer'); }
    else if (res === 'unauthorized') notify(ru ? 'Неверный ключ экипажа — сохранено только на этом устройстве' : 'Wrong crew key — saved on this device only');
    else if (res === 'invalid') notify(ru ? 'Сервер отклонил данные — проверь ссылки' : 'Server rejected the data — check the links');
    else notify(ru ? 'Нет связи с сервером — сохранено только на этом устройстве' : 'Server unreachable — saved on this device only');
  };

  const share = (() => {
    const u = typeof location !== 'undefined' ? location.href.split('#')[0] : '';
    const txt = ru ? 'Bangtaostyle.com — кольцо Таиланда в прямом эфире' : 'Bangtaostyle.com — the Thailand loop, live';
    const op = (h: string) => { try { window.open(h, '_blank'); } catch { /* ignore */ } };
    return [
      { n: 'COPY LINK', go: () => { try { navigator.clipboard.writeText(u).then(() => notify(t.toastCopied)).catch(() => notify(u)); } catch { notify(u); } } },
      { n: 'TELEGRAM', go: () => op('https://t.me/share/url?url=' + encodeURIComponent(u) + '&text=' + encodeURIComponent(txt)) },
      { n: 'WHATSAPP', go: () => op('https://wa.me/?text=' + encodeURIComponent(txt + ' ' + u)) },
      { n: 'VK', go: () => op('https://vk.com/share.php?url=' + encodeURIComponent(u)) },
    ];
  })();

  const inp = { className: 'field', style: { height: 42, fontSize: 13, fontFamily: 'var(--mono)' } as React.CSSProperties };
  return (
    <section className="sec" id="live" data-screen-label="stream">
      <div className="wrap">
        <SectionHead
          kicker={t.liveKicker}
          title={t.liveTitle2 + (journey.phase === 'live' ? ' LIVE' : '')}
          lead={journey.phase === 'live' ? t.liveNote : t.firstStream}
          right={
            <div className="seg">
              {PDEFS.map(([k, n]) => <button key={k} className={k === platTab ? 'on' : ''} onClick={() => setPlatTab(k)}>{n}</button>)}
              <button className={platTab === 'gtrcam' ? 'on' : ''} onClick={() => setPlatTab('gtrcam')}>GTR CAM</button>
            </div>
          }
        />
        <div className="live-grid">
          <div className="rv">
            {embMode === 'cam' ? (
              <div className="panel" style={{ padding: 12 }}><gtr-multiview room="gtrpht" /></div>
            ) : (
              <div className="player">
                {embMode === 'iframe' && (journey.phase === 'live' || armedFor === embSrc) && (
                  <iframe key={embSrc} src={embSrc} title="live player" loading="lazy" referrerPolicy="strict-origin-when-cross-origin"
                    allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowFullScreen />
                )}
                {embMode === 'iframe' && journey.phase !== 'live' && armedFor !== embSrc && (
                  <div className="player-facade">
                    <div className="kicker">{t.standby}</div>
                    <div className="pf-title">{t.firstStream}</div>
                    <button type="button" className="btn btn-red" onClick={() => setArmedFor(embSrc)}>
                      ▶ {ru ? 'Открыть плеер' : 'Open player'} · {PDEFS.find(([k]) => k === platTab)?.[1] || platTab}
                    </button>
                  </div>
                )}
                {embMode !== 'iframe' && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: '0 24px', textAlign: 'center', background: 'radial-gradient(60% 60% at 50% 40%, rgba(229,55,44,.14), transparent 70%)' }}>
                    <div style={{ position: 'absolute', left: 0, right: 0, height: '40%', background: 'linear-gradient(180deg,transparent,rgba(229,55,44,.06),transparent)', animation: 'omScan 5s linear infinite' }} />
                    <div className="kicker" style={{ animation: 'omBlink 2.4s infinite' }}>{journey.phase === 'live' ? 'LIVE SIGNAL' : t.standby}</div>
                    <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 'clamp(22px,3vw,36px)', letterSpacing: '-.02em', maxWidth: 520 }}>
                      {embMode === 'link' ? t.chLinkNote : t.firstStream}
                    </div>
                    {embMode === 'link' && <a className="btn btn-red" href={embHref} target="_blank" rel="noreferrer">{t.chWatchBtn}</a>}
                  </div>
                )}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 14 }}>
              <span className="meta" style={{ marginRight: 4 }}>{t.watchOn}</span>
              {PDEFS.map(([k, n]) => <a key={k} className="chip" href={chLink(k, (ch[k] || '').trim())} target="_blank" rel="noreferrer">{n}</a>)}
              <span style={{ flex: 1 }} />
              {share.map((sb) => <button key={sb.n} className="chip" style={{ cursor: 'pointer' }} onClick={sb.go}>{sb.n}</button>)}
            </div>
          </div>
          <div className="rv" style={{ ['--d' as string]: '.1s', display: 'flex' }}><Chat /></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(340px,100%),1fr))', gap: 16, marginTop: 16 }}>
          <div className="panel rv" style={{ padding: 24 }}>
            <div className="meta">{t.schedTitle}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
              {t.sched.map((row) => (
                <div key={row[0]} style={{ display: 'flex', gap: 16, alignItems: 'baseline' }}>
                  <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 20, color: 'var(--red-2)', minWidth: 64 }}>{row[0]}</span>
                  <span style={{ fontSize: 14.5, color: 'var(--ink-2)' }}>{row[1]}</span>
                </div>
              ))}
            </div>
            <button className="chip" style={{ marginTop: 20, cursor: 'pointer' }} onClick={() => setChOpen((v) => !v)}>{t.chOpenLbl}</button>
            {chOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
                <div className="meta">{t.chTitle} — {t.chHint}</div>
                {PDEFS.map(([k, n, ph]) => (
                  <label key={k} style={{ display: 'grid', gridTemplateColumns: '84px 1fr', alignItems: 'center', gap: 8 }}>
                    <span className="meta" style={{ fontSize: 9.5 }}>{n}</span>
                    <input {...inp} value={chDraftV[k] || ''} onChange={(e) => setChDraft({ ...chDraftV, [k]: e.target.value })} placeholder={ph} />
                  </label>
                ))}
                {([['payUrl', ru ? 'ОПЛАТА' : 'PAY URL', 'https://…'], ['posUrl', 'GPS URL', 'https://… {lat,lng,ts}']] as const).map(([k, n, ph]) => (
                  <label key={k} style={{ display: 'grid', gridTemplateColumns: '84px 1fr', alignItems: 'center', gap: 8 }}>
                    <span className="meta" style={{ fontSize: 9.5 }}>{n}</span>
                    <input {...inp} value={intV[k]} onChange={(e) => setIntDraft({ ...intV, [k]: e.target.value })} placeholder={ph} inputMode="url" autoCapitalize="none" autoCorrect="off" />
                  </label>
                ))}
                <label style={{ display: 'grid', gridTemplateColumns: '84px 1fr', alignItems: 'center', gap: 8 }}>
                  <span className="meta" style={{ fontSize: 9.5, color: 'var(--red-2)' }}>{ru ? 'КЛЮЧ' : 'CREW KEY'}</span>
                  <input {...inp} type="password" value={keyV} onChange={(e) => setKeyDraft(e.target.value)} placeholder={ru ? 'ключ экипажа' : 'crew key'} autoCapitalize="none" autoCorrect="off" autoComplete="current-password" />
                </label>
                <button className="btn btn-red" onClick={saveChannels} disabled={saving} style={{ marginTop: 6 }}>{saving ? '…' : t.chSave}</button>
              </div>
            )}
          </div>
          <div className="rv" style={{ ['--d' as string]: '.08s' }}><BoostPanel /></div>
        </div>
      </div>
    </section>
  );
}
