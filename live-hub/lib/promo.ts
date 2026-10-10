/**
 * Home-page title cards ("credits") and the warm-up campaign.
 * The campaign changes by itself with the tour timeline (days to start → live → done); the crew can add
 * their own teaser cards from /console (shared state `promo`), which play right after the cast card.
 */
import type { Journey } from './journey';

export interface Card { k: string; a: string; b?: string }
export interface PromoLine { a: string; b?: string }

const DAY = 864e5;

function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10, m100 = n % 100;
  return m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many;
}

export function daysToStart(j: Journey, now: number): number | null {
  return j.startMs == null ? null : Math.max(0, Math.ceil((j.startMs - now) / DAY));
}

/** Which warm-up stage the campaign is in. */
export function promoStage(j: Journey, now: number): 'intrigue' | 'reveal' | 'call' | 'today' | 'live' | 'done' {
  if (j.phase === 'live') return 'live';
  if (j.phase === 'done') return 'done';
  const d = daysToStart(j, now);
  if (d == null || d > 7) return 'intrigue';
  if (d >= 3) return 'reveal';
  if (d >= 1 && j.startMs! - now > DAY) return 'call';
  return 'today';
}

export const STAGE_LABEL: Record<ReturnType<typeof promoStage>, [string, string]> = {
  intrigue: ['Интрига (больше недели)', 'Intrigue (over a week)'],
  reveal: ['Раскрытие (7–3 дня)', 'Reveal (7–3 days)'],
  call: ['Призыв (2–1 дня)', 'Call to action (2–1 days)'],
  today: ['День старта', 'Start day'],
  live: ['Тур в эфире', 'Tour live'],
  done: ['После финиша', 'After the finish'],
};

export function campaign(j: Journey, now: number, ru: boolean, heroA: string, heroB: string, custom: PromoLine[] = []): Card[] {
  const d = daysToStart(j, now);
  const date = j.startMs != null ? new Date(j.startMs + 7 * 3600e3).toISOString().slice(5, 10).split('-').reverse().join('.') : '25.10';
  const stage = promoStage(j, now);
  const core: Card = { k: 'BANGTAOSTYLE.COM · PROTOCOL 10.10', a: heroA, b: heroB };
  const cast: Card = { k: ru ? 'УЧАСТНИКИ' : 'STARRING', a: 'ILIA | GTR' };
  // participant 02 — identity classified until the stream
  const gtr: Card[] = ru
    ? [{ k: 'УЧАСТНИК 02 · GTR', a: 'Королева', b: 'баварского премиума.' }, { k: 'ОБРАЗ: ЗАСЕКРЕЧЕН', a: 'Болты. Масло.', b: 'Приключения.' }]
    : [{ k: 'MEMBER 02 · GTR', a: 'Queen of', b: 'Bavarian premium.' }, { k: 'IDENTITY: CLASSIFIED', a: 'Bolts. Oil.', b: 'Adventure.' }];
  const count: Card | null = d != null && d > 0 && stage !== 'live'
    ? { k: ru ? 'ДО СТАРТА' : 'UNTIL START', a: ru ? `${d} ${plural(d, 'день', 'дня', 'дней')}` : `${d} day${d === 1 ? '' : 's'}`, b: `${date} · ${ru ? 'ПХУКЕТ' : 'PHUKET'}` }
    : null;

  const W = (k: string, a: string, b?: string): Card => ({ k, a, b });
  const T = ru ? 'ТИЗЕР' : 'TEASER';
  const warm: Record<typeof stage, Card[]> = ru ? {
    intrigue: [W(T, 'Что-то будет.', `${date}.`), W(T, 'Тачки, которых', 'нет в продаже.'), W(T, 'Виллы, которые', 'не показывают.'), W(T, 'Ночи', 'без монтажа.')],
    reveal: [W('МАРШРУТ', '3 540 км.', '7 городов. 3 парома.'), W('МАРШРУТ', 'Пхукет → Бангкок', '→ Пхукет.'), W('ФОРМАТ', 'Эфир. Карта. Чат.', 'Ты внутри.'), W('ФОРМАТ', 'Тачки · недвижка', '· движ.')],
    call: [W('ГОТОВНОСТЬ', 'Заряди телефон.', 'Старт на Bangla Road.'), W('ГОТОВНОСТЬ', 'Протокол 10.10', 'активируется.'), W('ГОТОВНОСТЬ', 'Включи уведомления.', 'Эфир без монтажа.')],
    today: [W('СТАРТ', 'Сегодня.', 'Bangla Road. Патонг.'), W('СТАРТ', 'Протокол 10.10', 'активирован.')],
    live: [W('В ЭФИРЕ', 'Мы в эфире.', `День ${j.day} из ${j.totalDays}.`), W('СЕЙЧАС', j.curStage || 'Кольцо Таиланда', j.posLabel), W('В ЭФИРЕ', 'Подключайся.', 'Без монтажа.')],
    done: [W('ФИНИШ', 'Кольцо', 'пройдено.'), W('ФИНИШ', 'Смотри', 'записи эфиров.')],
  } : {
    intrigue: [W(T, 'Something is coming.', `${date}.`), W(T, 'Cars that are', 'not for sale.'), W(T, 'Villas nobody', 'shows you.'), W(T, 'Nights', 'unedited.')],
    reveal: [W('ROUTE', '3,540 km.', '7 cities. 3 ferries.'), W('ROUTE', 'Phuket → Bangkok', '→ Phuket.'), W('FORMAT', 'Stream. Map. Chat.', "You're in."), W('FORMAT', 'Cars · real estate', '· nights out.')],
    call: [W('READY', 'Charge your phone.', 'Start on Bangla Road.'), W('READY', 'Protocol 10.10', 'is arming.'), W('READY', 'Turn notifications on.', 'Unedited stream.')],
    today: [W('START', 'Today.', 'Bangla Road. Patong.'), W('START', 'Protocol 10.10', 'is live.')],
    live: [W('LIVE', "We're live.", `Day ${j.day} of ${j.totalDays}.`), W('NOW', j.curStage || 'The Thailand loop', j.posLabel), W('LIVE', 'Jump in.', 'No edits.')],
    done: [W('FINISH', 'The loop', 'is done.'), W('FINISH', 'Watch', 'the recordings.')],
  };

  const own = custom.filter((c) => c.a?.trim()).map((c) => W(T, c.a.trim(), c.b?.trim() || undefined));
  return [core, cast, ...(stage === 'done' ? [] : gtr), ...own, ...(count ? [count] : []), ...warm[stage]];
}
