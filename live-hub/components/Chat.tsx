'use client';
import { useEffect, useRef, useState } from 'react';
import { useHub } from '@/lib/HubContext';
import { getCrewKey } from '@/lib/sharedState';

interface Msg { id: string; ts: number; nick: string; text: string; crew: boolean; author: string }

const NICK_LS = 'gtrpht_chat_nick';

export function Chat() {
  const { t, lang, auth, notify } = useHub();
  const ru = lang === 'ru';
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [online, setOnline] = useState(0);
  const [connected, setConnected] = useState(false);
  const [crew, setCrew] = useState(false);
  const [nick, setNick] = useState('');
  const [nickOk, setNickOk] = useState(false);
  const [text, setText] = useState('');
  const ws = useRef<WebSocket | null>(null);
  const list = useRef<HTMLDivElement | null>(null);
  const stick = useRef(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(NICK_LS);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate the saved nickname once on mount
      if (saved) { setNick(saved); setNickOk(true); }
      else if (auth.me?.nick) setNick(auth.me.nick);
    } catch { /* ignore */ }
  }, [auth.me?.nick]);

  useEffect(() => {
    let dead = false, retry = 0, timer: ReturnType<typeof setTimeout> | null = null, ping: ReturnType<typeof setInterval> | null = null;
    const connect = () => {
      if (dead) return;
      const key = getCrewKey();
      const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const s = new WebSocket(`${proto}//${location.host}/chat/ws${key ? '?key=' + encodeURIComponent(key) : ''}`);
      ws.current = s;
      s.onopen = () => { retry = 0; setConnected(true); };
      s.onmessage = (ev) => {
        if (ev.data === 'pong') return;
        let m: { type: string; [k: string]: unknown };
        try { m = JSON.parse(ev.data); } catch { return; }
        if (m.type === 'hello') { setMsgs((m.history as Msg[]) || []); setOnline(Number(m.online) || 0); setCrew(!!m.crew); }
        else if (m.type === 'msg') setMsgs((prev) => [...prev, m.m as Msg].slice(-150));
        else if (m.type === 'del') setMsgs((prev) => prev.filter((x) => x.id !== m.id));
        else if (m.type === 'online') setOnline(Number(m.n) || 0);
        else if (m.type === 'err') notify(m.code === 'slow' ? t.chatSlow : m.code === 'banned' ? t.chatMuted : String(m.text || ''));
      };
      s.onclose = () => {
        setConnected(false);
        if (dead) return;
        timer = setTimeout(connect, Math.min(15000, 800 * Math.pow(1.7, retry++)));
      };
    };
    connect();
    ping = setInterval(() => { try { if (ws.current?.readyState === 1) ws.current.send('ping'); } catch { /* ignore */ } }, 25000);
    return () => { dead = true; if (timer) clearTimeout(timer); if (ping) clearInterval(ping); ws.current?.close(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = list.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [msgs]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const n = nick.trim(), x = text.trim();
    if (n.length < 2) { notify(ru ? 'Сначала ник — от 2 символов' : 'Pick a nickname first (2+ chars)'); return; }
    if (!x || ws.current?.readyState !== 1) return;
    try { localStorage.setItem(NICK_LS, n); } catch { /* ignore */ }
    setNickOk(true);
    ws.current.send(JSON.stringify({ type: 'msg', nick: n, text: x }));
    setText('');
    stick.current = true;
  };
  const mod = (type: 'del' | 'ban', m: Msg) => ws.current?.send(JSON.stringify(type === 'del' ? { type, id: m.id } : { type, author: m.author }));
  const time = (ts: number) => new Date(ts).toLocaleTimeString(ru ? 'ru-RU' : 'en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' });

  return (
    <div className="panel chat">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid var(--line)' }}>
        <span className={'dot' + (connected ? ' live' : '')} />
        <span className="meta" style={{ color: 'var(--ink)', flex: 1 }}>{t.chatTitle}</span>
        <span className="meta">{connected ? `${online} ${t.chatOnline}` : t.chatOffline}</span>
      </div>
      <div className="chat-list" ref={list} onScroll={(e) => { const el = e.currentTarget; stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40; }}>
        {msgs.length === 0 && <div className="meta" style={{ margin: 'auto', textAlign: 'center' }}>{t.chatEmpty}</div>}
        {msgs.map((m) => (
          <div key={m.id} className={'chat-msg' + (m.crew ? ' crew' : '')}>
            <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', marginRight: 8 }}>{time(m.ts)}</span>
            <b>{m.crew ? '★ ' : ''}{m.nick}</b>{m.text}
            {crew && !m.crew && (
              <>
                <button className="x" onClick={() => mod('del', m)} title="delete">✕</button>
                <button className="x" onClick={() => mod('ban', m)} title="mute 24h">⊘</button>
              </>
            )}
          </div>
        ))}
      </div>
      <form className="chat-form" onSubmit={send} style={{ flexWrap: 'wrap' }}>
        {!nickOk ? (
          <input className="field" value={nick} onChange={(e) => setNick(e.target.value.slice(0, 24))} placeholder={t.chatNick} style={{ flex: '1 1 100%' }} autoComplete="nickname" />
        ) : null}
        <input className="field" value={text} onChange={(e) => setText(e.target.value.slice(0, 300))} placeholder={nickOk ? `${nick}: ${t.chatMsg}` : t.chatMsg} style={{ flex: 1, minWidth: 0 }} enterKeyHint="send" />
        {nickOk && <button type="button" className="x chip" style={{ height: 44, cursor: 'pointer' }} onClick={() => setNickOk(false)} title={t.chatNick}>@</button>}
        <button className="btn btn-red btn-sm" type="submit" style={{ width: 'auto', minHeight: 44 }} disabled={!connected}>{t.chatSend}</button>
      </form>
    </div>
  );
}
