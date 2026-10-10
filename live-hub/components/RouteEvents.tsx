'use client';
import { useEffect, useMemo, useState } from 'react';
import { useHub } from '@/lib/HubContext';
import { STOPS, buildSchedule, stageSpans } from '@/lib/tour';
import { DEFAULT_START } from '@/lib/journey';
import { SectionHead } from './ui/Motion';

/**
 * «Афиша по пути» — what's on in each city while the crew is there, straight from GTR Event
 * (gtrevent.com/api/route-events). Guests vote "хочу сюда" (shared counts, /api/route-votes) — the crew
 * sees where to go; every card links back into GTR Event, so the block also promotes the product.
 * Chiang Mai / Ayutthaya are not covered by GTR Event yet → shown honestly as "скоро".
 */
const GTR_EVENT = 'https://gtrevent.com';
const REGION: Record<string, string | null> = { phuket: 'phuket', samui: 'smu', phangan: 'pgn', chiangmai: null, ayutthaya: null, bangkok: 'bkk', pattaya: 'pty', 'phuket-final': 'phuket' };
const ICT = 7 * 3600e3;
const isoICT = (ms: number) => new Date(ms + ICT).toISOString().slice(0, 10);
const dm = (iso: string) => iso.slice(8, 10) + '.' + iso.slice(5, 7);

interface Ev { id: string; title: string; date: string; time?: string; price?: string; poster?: string; venue: string; venueId: string; region: string; url: string }

export function RouteEvents() {
  const { lang, journey } = useHub();
  const ru = lang === 'ru';
  const [events, setEvents] = useState<Ev[] | null>(null);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [mine, setMine] = useState<Record<string, 1>>({});
  const [tab, setTab] = useState(0);

  const startMs = journey.startMs ?? Date.parse(DEFAULT_START);
  const spans = useMemo(() => stageSpans(buildSchedule(startMs)).map((sp) => ({ ...sp, from: isoICT(sp.s), to: isoICT(sp.e) })), [startMs]);
  const from = spans[0]?.from, to = spans[spans.length - 1]?.to;

  useEffect(() => {
    let alive = true;
    const regions = [...new Set(Object.values(REGION).filter(Boolean))].join(',');
    fetch(`${GTR_EVENT}/api/route-events?from=${from}&to=${to}&regions=${regions}`)
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d: { items?: Ev[] }) => { if (alive) setEvents(Array.isArray(d.items) ? d.items : []); })
      .catch(() => { if (alive) setEvents([]); });
    fetch('/api/route-votes', { cache: 'no-store' }).then((r) => r.json()).then((d) => { if (alive && d?.votes) setVotes(d.votes); }).catch(() => {});
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read this device's votes once
    try { setMine(JSON.parse(localStorage.getItem('gtrpht_route_votes') || '{}')); } catch { /* ignore */ }
    return () => { alive = false; };
  }, [from, to]);

  const byStage = useMemo(() => spans.map((sp, i) => {
    const reg = REGION[STOPS[i].id];
    const list = !reg || !events ? [] : events.filter((e) => e.region === reg && e.date >= sp.from && e.date <= sp.to);
    list.sort((a, b) => (votes[b.id] || 0) - (votes[a.id] || 0) || a.date.localeCompare(b.date));
    return { sp, stop: STOPS[i], covered: !!reg, list };
  }), [spans, events, votes]);

  const vote = (id: string) => {
    if (mine[id]) return;
    const next = { ...mine, [id]: 1 as const };
    setMine(next); setVotes((v) => ({ ...v, [id]: (v[id] || 0) + 1 }));
    try { localStorage.setItem('gtrpht_route_votes', JSON.stringify(next)); } catch { /* ignore */ }
    fetch('/api/route-votes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
      .then((r) => r.json()).then((d) => { if (d?.votes) setVotes(d.votes); }).catch(() => {});
  };

  const cur = byStage[Math.min(tab, byStage.length - 1)];
  const total = byStage.reduce((n, s) => n + s.list.length, 0);
  const promo = `${GTR_EVENT}/?utm_source=bangtaostyle&utm_medium=route`;

  return (
    <section className="sec" id="events" data-screen-label="events">
      <div className="wrap">
        <SectionHead
          kicker={ru ? 'АФИША ПО ПУТИ · ПРИ ПОДДЕРЖКЕ GTR EVENT' : 'ON THE WAY · POWERED BY GTR EVENT'}
          title={ru ? 'Куда идём вечером' : "Where we go tonight"}
          lead={ru
            ? 'Все события городов маршрута в дни, когда там экипаж. Голосуй «хочу сюда» — самые желанные места попадут в эфир.'
            : 'Everything on in each city of the route while the crew is there. Vote “I want this” — the most wanted spots make it to the stream.'}
          right={<a className="chip" href={promo} target="_blank" rel="noreferrer">GTR EVENT ↗</a>}
        />

        <div className="ev-tabs" role="tablist">
          {byStage.map((s, i) => (
            <button key={s.stop.id} role="tab" aria-selected={i === tab} className={'ev-tab' + (i === tab ? ' on' : '') + (s.covered ? '' : ' off')} onClick={() => setTab(i)}>
              <b>{ru ? s.stop.ru : s.stop.en}</b>
              <span>{dm(s.sp.from)}{s.sp.to !== s.sp.from ? '–' + dm(s.sp.to) : ''}{s.covered && events ? ` · ${s.list.length}` : ''}</span>
            </button>
          ))}
        </div>

        <div className="ev-list">
          {!cur.covered ? (
            <div className="ev-empty">
              <b>{ru ? `${cur.stop.ru} — скоро в GTR Event` : `${cur.stop.en} — coming to GTR Event`}</b>
              <p>{ru ? 'Афишу этого города собираем прямо в туре. Знаешь крутое место — напиши в чат эфира.' : 'We are mapping this city during the tour. Know a great spot — drop it in the stream chat.'}</p>
            </div>
          ) : events === null ? (
            <div className="ev-empty"><span className="meta">{ru ? 'загружаем афишу…' : 'loading…'}</span></div>
          ) : cur.list.length === 0 ? (
            <div className="ev-empty">
              <b>{ru ? 'Афиша на эти даты ещё не вышла' : 'No listings for these dates yet'}</b>
              <p>{ru ? 'Площадки публикуют программу ближе к дате — GTR Event подтягивает её автоматически каждые 6 часов.' : 'Venues publish closer to the date — GTR Event pulls it in automatically every 6 hours.'}</p>
              <a className="btn btn-sm" href={promo} target="_blank" rel="noreferrer">{ru ? 'Вся афиша в GTR Event' : 'All listings on GTR Event'}</a>
            </div>
          ) : cur.list.slice(0, 24).map((e) => (
            <article key={e.id} className="ev-card">
              <div className="ev-img">{e.poster ? <img src={e.poster} alt="" loading="lazy" referrerPolicy="no-referrer" /> : <span className="line-mark" aria-hidden />}</div>
              <div className="ev-body">
                <span className="meta">{dm(e.date)}{e.time ? ' · ' + e.time : ''}{e.price ? ' · ' + e.price : ''}</span>
                <h4>{e.title}</h4>
                <span className="ev-venue">{e.venue}</span>
                <div className="ev-act">
                  <button className={'btn btn-sm' + (mine[e.id] ? ' btn-red' : '')} onClick={() => vote(e.id)} aria-pressed={!!mine[e.id]}>
                    {mine[e.id] ? (ru ? '✓ ХОЧУ' : '✓ IN') : (ru ? 'ХОЧУ СЮДА' : 'I WANT THIS')}{votes[e.id] ? ` · ${votes[e.id]}` : ''}
                  </button>
                  <a className="ev-link" href={e.url} target="_blank" rel="noreferrer">GTR Event ↗</a>
                </div>
              </div>
            </article>
          ))}
        </div>
        {events !== null && total > 0 && <div className="meta ev-foot">{ru ? `${total} событий на маршруте · данные GTR Event` : `${total} events on the route · data by GTR Event`}</div>}
      </div>
    </section>
  );
}
