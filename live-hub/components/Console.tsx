'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { getCrewKey, setCrewKey, pushShared, pullShared } from '@/lib/sharedState';
import { ls } from '@/lib/storage';
import type { Car } from './Cars';
import { DEFAULT_START } from '@/lib/journey';

type Post = { id: string; ts: number; member: string; type: 'post' | 'mat' | 'hyp' | 'obs'; text: string; link?: string };
const STATUSES: [string, string][] = [['drive', 'В ПУТИ'], ['base', 'НА БАЗЕ'], ['ferry', 'ПАРОМ'], ['live', 'В ЭФИРЕ'], ['stop', 'СТОП']];
const STAGES: [string, string][] = [['hunt', 'Охота'], ['bought', 'Куплена'], ['restore', 'В работе'], ['parts', 'Ждём запчасти'], ['done', 'Готова'], ['sold', 'Продана']];
const CH = ['twitch', 'youtube', 'kick', 'vk', 'telegram', 'tiktok'];

/** ICT wall-clock "YYYY-MM-DDTHH:mm" ⇄ ISO */
const toLocal = (iso?: string | null) => (iso ? new Date(Date.parse(iso) + 7 * 3600e3).toISOString().slice(0, 16) : '');
const fromLocal = (v: string) => (v ? new Date(Date.parse(v + ':00Z') - 7 * 3600e3).toISOString() : null);

function Card({ title, children, note }: { title: string; children: React.ReactNode; note?: string }) {
  return (
    <section className="panel" style={{ padding: 22 }}>
      <div className="kicker" style={{ fontSize: 10 }}>{title}</div>
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
      {note && <div className="meta" style={{ marginTop: 12, fontSize: 9.5, lineHeight: 1.6, textTransform: 'none', letterSpacing: '.04em' }}>{note}</div>}
    </section>
  );
}

export default function Console() {
  const [key, setKey] = useState('');
  const [ok, setOk] = useState<null | boolean>(null);
  const [msg, setMsg] = useState('');
  const [start, setStart] = useState('');
  const [by, setBy] = useState('ILIA');
  const [post, setPost] = useState({ type: 'post' as Post['type'], text: '', link: '' });
  const [posts, setPosts] = useState<Post[]>([]);
  const [garage, setGarage] = useState<Car[]>([]);
  const [car, setCar] = useState<Partial<Car>>({ stage: 'hunt' });
  const [channels, setChannels] = useState<Record<string, string>>({});
  const [ints, setInts] = useState({ payUrl: '', posUrl: '' });
  const [gpsAuto, setGpsAuto] = useState(false);
  const watch = useRef<number | null>(null);

  const say = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3500); };
  const load = async () => {
    await pullShared();
    const tr = ls<{ start?: string | null } | null>('gtrpht_tour', null);
    setStart(toLocal(tr == null || tr.start === undefined ? DEFAULT_START : tr.start));
    setPosts(ls<Post[]>('gtrpht_posts', []));
    setGarage(ls<Car[]>('gtrpht_garage', []));
    setChannels(ls<Record<string, string>>('gtrpht_channels', {}));
    const i = ls<{ payUrl?: string; posUrl?: string }>('gtrpht_integrations', {});
    setInts({ payUrl: i.payUrl || '', posUrl: i.posUrl || '' });
  };
  const check = async (k: string) => {
    const r = await fetch('/api/crew/check', { headers: { 'X-Crew-Key': k }, cache: 'no-store' }).catch(() => null);
    setOk(!!r && (r.ok || r.status !== 401));
  };
  useEffect(() => {
    const k = getCrewKey();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read the device's saved key once
    setKey(k);
    if (k) check(k);
    load();
    try { setBy(localStorage.getItem('gtrpht_console_by') || 'ILIA'); } catch { /* ignore */ }
    return () => { if (watch.current != null) navigator.geolocation.clearWatch(watch.current); };
  }, []);

  const save = async (patch: Parameters<typeof pushShared>[0], okText: string) => {
    const r = await pushShared(patch);
    say(r === 'ok' ? '✓ ' + okText : r === 'unauthorized' ? '✗ Неверный ключ экипажа' : r === 'invalid' ? '✗ Сервер отклонил данные' : '✗ Нет связи с сервером');
    if (r === 'unauthorized') setOk(false);
    await load();
  };

  const sendPos = (p: GeolocationPosition) => fetch('/api/pos', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Crew-Key': getCrewKey() },
    body: JSON.stringify({ lat: p.coords.latitude, lng: p.coords.longitude, ts: Date.now(), by }),
  }).then((r) => say(r.ok ? `✓ GPS ${p.coords.latitude.toFixed(4)}, ${p.coords.longitude.toFixed(4)}` : '✗ GPS не принят (' + r.status + ')')).catch(() => say('✗ Нет связи'));
  const gpsOnce = () => navigator.geolocation.getCurrentPosition(sendPos, (e) => say('✗ GPS: ' + e.message), { enableHighAccuracy: true, timeout: 20000 });
  const toggleAuto = () => {
    if (gpsAuto) { if (watch.current != null) navigator.geolocation.clearWatch(watch.current); watch.current = null; setGpsAuto(false); return; }
    let last = 0;
    watch.current = navigator.geolocation.watchPosition((p) => { if (Date.now() - last > 60000) { last = Date.now(); sendPos(p); } }, (e) => say('✗ GPS: ' + e.message), { enableHighAccuracy: true });
    setGpsAuto(true);
  };

  const addPost = () => {
    if (!post.text.trim()) return;
    const next: Post[] = [{ id: Date.now().toString(36), ts: Date.now(), member: by, type: post.type, text: post.text.trim(), link: post.link.trim() }, ...posts].slice(0, 50);
    save({ posts: next }, 'Пост опубликован');
    setPost({ type: 'post', text: '', link: '' });
  };
  const saveCar = () => {
    if (!car.name?.trim()) { say('✗ Название машины'); return; }
    const c: Car = { id: car.id || Date.now().toString(36), name: car.name.trim(), year: car.year || '', city: car.city || '', stage: car.stage || 'hunt', paid: car.paid || '', note: car.note || '', img: car.img || '', ts: car.ts || Date.now() };
    const next = car.id ? garage.map((g) => (g.id === car.id ? c : g)) : [c, ...garage];
    save({ garage: next }, car.id ? 'Машина обновлена' : 'Машина в гараже');
    setCar({ stage: 'hunt' });
  };

  const inp = (v: string, on: (s: string) => void, ph: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <input className="field" value={v} onChange={(e) => on(e.target.value)} placeholder={ph} autoCapitalize="none" autoCorrect="off" {...extra} />
  );

  return (
    <div className="hub" style={{ padding: '0 0 80px' }}>
      <header className="top scrolled"><div className="top-in">
        <Link href="/" className="logo">BANGTAOSTYLE<i>.COM</i></Link>
        <span className="meta">КОНСОЛЬ ЭКИПАЖА</span>
        <div className="top-sp" />
        <Link href="/camera/" className="chip">КАМЕРА</Link>
        <Link href="/pult/" className="chip">ПУЛЬТ</Link>
      </div></header>
      {msg && <div className="glass" style={{ position: 'fixed', zIndex: 2000, top: 76, left: '50%', transform: 'translateX(-50%)', padding: '12px 18px', fontSize: 14 }}>{msg}</div>}
      <div className="wrap" style={{ marginTop: 28, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(360px,100%),1fr))', gap: 14, alignItems: 'start' }}>
        <Card title="КЛЮЧ ЭКИПАЖА" note="Хранится только на этом устройстве. Нужен для всех действий ниже, камеры и пульта.">
          <div style={{ display: 'flex', gap: 8 }}>
            {inp(key, setKey, 'ключ экипажа', { type: 'password', style: { flex: 1 } })}
            <button className="btn btn-red btn-sm" style={{ width: 'auto', minHeight: 48 }} onClick={() => { setCrewKey(key); check(key); }}>OK</button>
          </div>
          <div className="meta" style={{ color: ok ? '#6fdc8c' : ok === false ? 'var(--red-2)' : undefined }}>{ok == null ? 'ключ не проверен' : ok ? '✓ ключ принят' : '✗ ключ не подходит'}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="meta">КТО ЗА ПУЛЬТОМ</span>
            <div className="seg">{['ILIA', 'GTR', 'CAM'].map((n) => <button key={n} className={by === n ? 'on' : ''} onClick={() => { setBy(n); try { localStorage.setItem('gtrpht_console_by', n); } catch { /* */ } }}>{n}</button>)}</div>
          </div>
        </Card>

        <Card title="СТАРТ ТУРА" note="Время Таиланда (ICT). Финиш фиксирован: 15 ноября 2026, Пхукет. Пустое поле — на сайте «Старт скоро».">
          <input className="field" type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-red btn-sm" style={{ flex: 1 }} onClick={() => save({ tour: { start: fromLocal(start) } }, 'Дата старта сохранена')}>СОХРАНИТЬ</button>
            <button className="btn btn-sm" style={{ flex: 1 }} onClick={() => { setStart(''); save({ tour: { start: null } }, '«Старт скоро»'); }}>СТАРТ СКОРО</button>
          </div>
        </Card>

        <Card title="СТАТУС И GPS" note="Авто-GPS шлёт позицию раз в минуту, пока эта страница открыта. Для фона используйте OwnTracks на /api/pos?key=…">
          <div className="seg">{STATUSES.map(([c, l]) => <button key={c} onClick={() => save({ status: { code: c, by, ts: Date.now() } }, 'Статус: ' + l)}>{l}</button>)}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-sm" style={{ flex: 1 }} onClick={gpsOnce}>ОТПРАВИТЬ ПОЗИЦИЮ</button>
            <button className={'btn btn-sm' + (gpsAuto ? ' btn-red' : '')} style={{ flex: 1 }} onClick={toggleAuto}>{gpsAuto ? '● АВТО-GPS ВКЛ' : 'АВТО-GPS'}</button>
          </div>
        </Card>

        <Card title="БОРТЖУРНАЛ">
          <div className="seg">{([['post', 'ПОСТ'], ['mat', 'МАТЕРИАЛ'], ['hyp', 'ГИПОТЕЗА'], ['obs', 'НАБЛЮДЕНИЕ']] as const).map(([k, l]) => <button key={k} className={post.type === k ? 'on' : ''} onClick={() => setPost({ ...post, type: k })}>{l}</button>)}</div>
          <textarea className="field" value={post.text} onChange={(e) => setPost({ ...post, text: e.target.value })} placeholder="Что происходит" />
          {inp(post.link, (v) => setPost({ ...post, link: v }), 'https://ссылка (необязательно)')}
          <button className="btn btn-red btn-sm" onClick={addPost}>ОПУБЛИКОВАТЬ</button>
          {posts.slice(0, 5).map((p) => (
            <div key={p.id} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: 'var(--ink-2)' }}>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.member}: {p.text}</span>
              <button className="chip" style={{ cursor: 'pointer' }} onClick={() => save({ posts: posts.filter((x) => x.id !== p.id) }, 'Пост удалён')}>✕</button>
            </div>
          ))}
        </Card>

        <Card title="ГАРАЖ ТУРА" note="Фото — https-ссылка (например, из Telegram-канала или облака).">
          {inp(car.name || '', (v) => setCar({ ...car, name: v }), 'Марка и модель')}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {inp(car.year || '', (v) => setCar({ ...car, year: v }), 'Год')}
            {inp(car.city || '', (v) => setCar({ ...car, city: v }), 'Город')}
            {inp(car.paid || '', (v) => setCar({ ...car, paid: v }), 'Цена сделки')}
            <select className="field" value={car.stage} onChange={(e) => setCar({ ...car, stage: e.target.value })}>{STAGES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          </div>
          {inp(car.img || '', (v) => setCar({ ...car, img: v }), 'https://фото')}
          <textarea className="field" value={car.note || ''} onChange={(e) => setCar({ ...car, note: e.target.value })} placeholder="История машины, что делаем" />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-red btn-sm" style={{ flex: 1 }} onClick={saveCar}>{car.id ? 'ОБНОВИТЬ' : 'ДОБАВИТЬ В ГАРАЖ'}</button>
            {car.id && <button className="btn btn-sm" onClick={() => setCar({ stage: 'hunt' })}>ОТМЕНА</button>}
          </div>
          {garage.map((g) => (
            <div key={g.id} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13.5 }}>
              <span style={{ flex: 1 }}>{g.name} {g.year} · <span className="meta">{STAGES.find((s) => s[0] === g.stage)?.[1]}</span></span>
              <button className="chip" style={{ cursor: 'pointer' }} onClick={() => setCar(g)}>✎</button>
              <button className="chip" style={{ cursor: 'pointer' }} onClick={() => save({ garage: garage.filter((x) => x.id !== g.id) }, 'Удалено из гаража')}>✕</button>
            </div>
          ))}
        </Card>

        <Card title="КАНАЛЫ ЭФИРА И ОПЛАТА" note="YouTube: ID канала (UC…) или видео. VK: oid_id видео. Ссылка оплаты может содержать {amt}.">
          {CH.map((k) => (
            <label key={k} style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 8, alignItems: 'center' }}>
              <span className="meta">{k}</span>
              {inp(channels[k] || '', (v) => setChannels({ ...channels, [k]: v }), k === 'youtube' ? 'UC… или ID видео' : '@handle')}
            </label>
          ))}
          <label style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 8, alignItems: 'center' }}><span className="meta">оплата</span>{inp(ints.payUrl, (v) => setInts({ ...ints, payUrl: v }), 'https://…{amt}')}</label>
          <label style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 8, alignItems: 'center' }}><span className="meta">gps url</span>{inp(ints.posUrl, (v) => setInts({ ...ints, posUrl: v }), 'https://… (необязательно)')}</label>
          <button className="btn btn-red btn-sm" onClick={() => save({ channels, integrations: ints }, 'Каналы сохранены')}>СОХРАНИТЬ</button>
        </Card>
      </div>
    </div>
  );
}
