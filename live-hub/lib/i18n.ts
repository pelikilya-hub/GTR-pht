// RU/EN dictionary — ported verbatim from the Live Hub prototype's translation tables.

export interface Tier { name: string; price: number; desc: string; perks: string[]; }
export interface CrewMember { name: string; role: string; desc: string; ph: string; }
export interface GtrCard { code: string; title: string; desc: string; }
export interface GtrForm { variant: string; label: string; }
export interface ContentLine { code: string; accent: string; title: string; desc: string; foot: string; }
export interface Place { name: string; day: string; tag: string; tagCol: string; desc: string; ph: string; }
export interface InvitePoint { n: string; txt: string; }
export interface CityQuiz { q: string; opts: string[]; goal: number; }

export interface Dict {
  tagline: string; heroA: string; heroB: string; heroSub: string; ctaWatch: string; ctaJoin: string;
  sDays: string; sKm: string; sBases: string; sSpots: string;
  cdTitle: string; cdD: string; cdH: string; cdM: string; cdS: string;
  liveTitle: string; doneTitle: string; dayWord: string; kmUnit: string; startLabel: string;
  mapTitle: string; lgBase: string; lgFerry: string; lgDone: string; srcGps: string; srcPlan: string;
  mapHint: string; posWait: string; telTitle: string; kmDoneW: string; telRoute: string; telStage: string;
  telStatus: string; telNext: string; statusPlan: string; minAgo: string; hrAgo: string;
  statuses: Record<'drive' | 'base' | 'ferry' | 'live' | 'stop', string>;
  finishWord: string; streamTitle: string; standby: string; firstStream: string; liveNote: string; liveNow: string;
  watchOn: string; schedTitle: string; sched: [string, string][];
  boostTitle: string; boostName: string; boostNote: string; donate: string;
  jrTitle: string; jrSub: string; jrOpen: string; jrEmptyTxt: string;
  jrTypes: Record<'post' | 'mat' | 'hyp' | 'obs', string>; jrLink: string;
  tiersTitle: string; tiersSub: string; perMonth: string; popular: string; choose: string; tiers: Tier[];
  clubTitle: string; club: string[];
  tlTitle: string; tlSub: string; stWait: string; stActive: string; stDone: string;
  crewTitle: string; crew: CrewMember[];
  spTitle: string; spSub: string; spFree: string; spCta: string; spPh: string;
  f1: string; f2: string; bootInit: string; bootSkip: string; toastPay: string;
  statusSoon: string; statusLive: string; statusDone: string; consoleLink: string;
  gtrTitle: string; gtrLead: string; gtrCards: GtrCard[]; gtrGoodCode: string; gtrGoodTitle: string; gtrGoodDesc: string;
  gtrForms: GtrForm[];
  lnTitle: string; lnSub: string; lines: ContentLine[];
  plTitle: string; plSub: string; places: Place[];
  invKicker: string; invTitle: string; invLead: string; invPoints: InvitePoint[];
  invFName: string; invFPlace: string; invFOffer: string; invOfferList: string[];
  invFContact: string; invFMsg: string; invSendBtn: string; invNote: string;
  toastInv: string; invErr: string; qToast: string;
  comfortLbl: string; comfortLvls: string[]; quizLbl: string; cityQuiz: CityQuiz[];
  chTitle: string; chHint: string; chSave: string; chToast: string; chOpenLbl: string;
  chEmptyNote: string; chLinkNote: string; chWatchBtn: string; shareLbl: string; toastCopied: string;
  nav: [string, string][];
  carsKicker: string; carsTitle: string; carsLead: string; carsSteps: { t: string; d: string }[];
  carsGarage: string; carsEmpty: string; carStages: Record<string, string>;
  carsTipTitle: string; carsTipLead: string; carsTipCar: string; carsTipWhere: string; carsTipPrice: string;
  carsTipContact: string; carsTipBtn: string; carsTipOk: string; carsTipErr: string;
  chatTitle: string; chatNick: string; chatMsg: string; chatSend: string; chatOnline: string;
  chatSlow: string; chatMuted: string; chatEmpty: string; chatOffline: string;
  routeKicker: string; routeTitle: string; liveKicker: string; liveTitle2: string; soonBig: string; dayOf: string;
}

const RU: Dict = {
  tagline: 'НОВАЯ ЭРА. НОВЫЕ ПРАВИЛА. НОВЫЙ ТЫ.',
  heroA: 'Кольцо Таиланда.', heroB: 'В прямом эфире.',
  heroSub: 'ILIA и GTR проходят кольцо Пхукет → Самуи → Панган → Чиангмай → Аюттхая → Бангкок → Паттайя → Пхукет. Тачки, недвижимость, добрые дела и разъёб — без монтажа, с живой картой и чатом.',
  ctaWatch: 'СМОТРЕТЬ ЭФИР', ctaJoin: 'ВСТУПИТЬ В ЭКИПАЖ',
  sDays: 'ДНЕЙ В ПУТИ', sKm: 'КМ ПО КОЛЬЦУ', sBases: 'ГОРОДОВ + 3 ПАРОМА', sSpots: 'МЕСТ СИЛЫ',
  cdTitle: 'ДО СТАРТА ПРОТОКОЛА', cdD: 'ДНИ', cdH: 'ЧАСЫ', cdM: 'МИН', cdS: 'СЕК',
  liveTitle: 'ПРОТОКОЛ АКТИВЕН', doneTitle: 'ПРОТОКОЛ ЗАВЕРШЁН', dayWord: 'ДЕНЬ', kmUnit: 'КМ',
  startLabel: 'СТАРТ: 01.08.2026 · 09:00 ICT · ПХУКЕТ',
  mapTitle: '// LIVE-ТРЕКИНГ МАРШРУТА', lgBase: 'база', lgFerry: 'паром', lgDone: 'пройдено',
  srcGps: 'GPS ЭКИПАЖА', srcPlan: 'ОЦЕНКА ПО ГРАФИКУ',
  mapHint: 'Карта © OpenStreetMap, OpenFreeMap. Позиция приходит с GPS экипажа; пока сигнала нет — честная оценка по графику маршрута.',
  posWait: 'ожидание старта',
  telTitle: '// ТЕЛЕМЕТРИЯ ПРОТОКОЛА', kmDoneW: 'ПРОЙДЕНО ', telRoute: 'МАРШРУТ', telStage: 'ЭТАП',
  telStatus: 'СТАТУС', telNext: 'СЛЕД. ТОЧКА', statusPlan: 'ПО ГРАФИКУ', minAgo: 'мин назад', hrAgo: 'ч назад',
  statuses: { drive: 'В ПУТИ', base: 'НА БАЗЕ', ferry: 'ПАРОМ', live: 'В ЭФИРЕ', stop: 'СТОП' },
  finishWord: 'ФИНИШ — ПХУКЕТ',
  streamTitle: '// ЭФИР', standby: 'SIGNAL: STANDBY',
  firstStream: 'Первая съёмка — Bangla Road, Патонг · в день старта',
  liveNote: 'Эфир идёт прямо сейчас — выбери платформу ниже', liveNow: 'В ЭФИРЕ', watchOn: 'СМОТРЕТЬ НА',
  schedTitle: 'РАСПИСАНИЕ (ICT)',
  sched: [['09:00', 'ПЕРЕГОН — дорожный эфир из машины'], ['18:30', 'ЗАКАТ — место силы дня'], ['22:00', 'РАЗБОР ДНЯ — только для клуба «Протокол»']],
  boostTitle: '// БУСТ-ЦЕЛЬ №2', boostName: 'Дрон для съёмки перегонов',
  boostNote: 'Каждый донат — имя в титрах дня и шаг к дрону над перегонами.',
  donate: 'ЗАДОНАТИТЬ',
  jrTitle: 'БОРТЖУРНАЛ ЭКИПАЖА', jrSub: 'ЗАПИСИ, ГИПОТЕЗЫ И НАБЛЮДЕНИЯ — НАПРЯМУЮ ИЗ КОНСОЛИ ЭКИПАЖА',
  jrOpen: 'КОНСОЛЬ ЭКИПАЖА →',
  jrEmptyTxt: 'Журнал пуст. Первые посты, гипотезы и наблюдения появятся здесь, как только экипаж опубликует их в консоли — записи сохраняются и рассылаются по вебхукам.',
  jrTypes: { post: 'ПОСТ', mat: 'МАТЕРИАЛ', hyp: 'ГИПОТЕЗА', obs: 'НАБЛЮДЕНИЕ' }, jrLink: 'МАТЕРИАЛ →',
  tiersTitle: 'УРОВНИ ДОСТУПА', tiersSub: 'ПОДПИСКА ОТКРЫВАЕТ ТО, ЧТО НЕ ПОПАДАЕТ В ПУБЛИЧНЫЙ ЭФИР',
  perMonth: '/МЕС', popular: 'ВЫБОР ЭКИПАЖА', choose: 'АКТИВИРОВАТЬ',
  tiers: [
    { name: 'НАБЛЮДАТЕЛЬ', price: 99, desc: 'Смотреть глубже', perks: ['Чат эфира без ограничений', 'Карта и телеметрия без задержки', 'Еженедельный дайджест маршрута'] },
    { name: 'ЭКИПАЖ', price: 399, desc: 'Ехать с нами', perks: ['Всё из «Наблюдателя»', 'Закрытый канал «Протокол»', 'Точки маршрута до публикации', 'Голосование «куда едем завтра»'] },
    { name: 'ПРОТОКОЛ Ω', price: 1499, desc: 'Влиять на маршрут', perks: ['Всё из «Экипажа»', 'Ежемесячный созвон с экипажем', 'Имя в титрах финального фильма', 'Право назначить точку дня', 'Лимит — 100 мест'] },
  ],
  clubTitle: 'ВНУТРИ ЗАКРЫТОГО КАНАЛА «ПРОТОКОЛ»',
  club: ['Сырые дропы с телефона — каждый день', 'Координаты мест силы до эфира', 'Фейлы, которые не выйдут в паблик', 'Голосовой разбор после каждого перегона'],
  tlTitle: '8 ТОЧЕК КОЛЬЦА', tlSub: 'СТАТУС ОБНОВЛЯЕТСЯ АВТОМАТИЧЕСКИ',
  stWait: 'ОЖИДАНИЕ', stActive: 'В ПУТИ', stDone: 'ПРОЙДЕН',
  crewTitle: 'ЭКИПАЖ ПРОТОКОЛА',
  crew: [
    { name: 'ILIA', role: 'ГОЛОС ПРОТОКОЛА', desc: 'Эфиры, разговоры, смысл. Держит связь с аудиторией из любой точки маршрута.', ph: 'фото ILIA — перетащи сюда' },
    { name: 'GTR', role: 'УЧАСТНИК 02 · ОБРАЗ ЗАСЕКРЕЧЕН', desc: 'Роковая королева баварского премиума. Интересная история, тяга к болтам, маслу и приключениям. Кто она — узнаешь в эфире.', ph: 'фото GTR — перетащи сюда' },
    { name: 'НОВЫЙ ЧЛЕН', role: 'ОПЕРАТОР', desc: 'Камера, монтаж на ходу, дрон. Третий глаз протокола — снимает то, что не видит экипаж.', ph: 'фото оператора — перетащи сюда' },
  ],
  spTitle: 'СПОНСОРСКИЕ СЛОТЫ', spSub: 'ИНТЕГРАЦИИ: БОРТ МАШИНЫ · ОВЕРЛЕЙ ЭФИРА · ДЖИНГЛ · НАТИВНЫЕ ТОЧКИ МАРШРУТА',
  spFree: '// СВОБОДНО', spCta: 'ЗАБРАТЬ СЛОТ →', spPh: 'логотип партнёра',
  f1: 'BANGTAOSTYLE.COM · PROTOCOL 10.10 · ALL SYSTEMS SYNCHRONIZED',
  f2: 'ILIA · GTR — Таиланд, осень 2026. Финиш 15 ноября на Пхукете.',
  bootInit: 'ИНИЦИАЛИЗАЦИЯ ПРОТОКОЛА', bootSkip: 'НАЖМИ, ЧТОБЫ ПРОПУСТИТЬ',
  toastPay: 'Открываем оплату в новой вкладке',
  statusSoon: 'СКОРО', statusLive: 'LIVE', statusDone: 'ФИНИШ', consoleLink: 'КОНСОЛЬ',
  gtrTitle: 'Возможности управления реальностью',
  gtrLead: 'GTR — не тюнинг машины. Это протокол трансформации. По пути — трансформационные вечера, разборы и закрытые вечеринки. Обсуждаем изменения вживую: от вашего участия и голосов зависит, где мы окажемся завтра.',
  gtrCards: [
    { code: 'RITUAL 01', title: 'Трансформационные вечера', desc: 'Живые встречи по маршруту: разборы, практики, честный разговор о переменах.' },
    { code: 'RITUAL 02', title: 'Закрытые вечеринки', desc: 'Только для клуба. Локация раскрывается за несколько часов. Кто внутри — тот внутри.' },
    { code: 'RITUAL 03', title: 'Голос решает', desc: 'Куда ехать, где остановиться, что разобрать в эфире — решает голосование зрителей.' },
  ],
  gtrGoodCode: 'КАРМА · ПРОТОКОЛ БЛАГА', gtrGoodTitle: 'Кому поможем сегодня — решит судьба',
  gtrGoodDesc: 'Часть донатов каждого этапа уходит на благо. Получателя выбирает жребий в прямом эфире — честно, на камеру, без сценария.',
  gtrForms: [
    { variant: 'chedi', label: 'FORM 02 · CHEDI · SIGNAL RISING' },
    { variant: 'wai', label: 'FORM 03 · WAI · GRATITUDE PROTOCOL' },
    { variant: 'church', label: 'FORM 04 · SOBOR · UNITY SIGNAL' },
    { variant: 'ilia', label: 'FORM 05 · ILIA · PILOT SIGNAL' },
  ],
  lnTitle: 'Линии контента', lnSub: '6 ПОТОКОВ · ОДИН ЭФИР',
  lines: [
    { code: 'LINE 01 · SPIRIT', accent: '#8E8C94', title: 'ДУХ', desc: 'Реальная духовная жизнь тура: храмы, монахи, практики на рассвете, места силы — без глянца и постановки.', foot: 'КАЖДОЕ УТРО В ЭФИРЕ' },
    { code: 'LINE 02 · RAW', accent: '#E5372C', title: 'РАЗЪЁБ', desc: 'Закрытые вечеринки и ночи без сценария. Камера не выключается. Что произошло в эфире — остаётся в эфире.', foot: 'ЛОКАЦИЯ — ЗА 3 ЧАСА ДО' },
    { code: 'LINE 03 · REALTY', accent: '#ECE9E4', title: 'НЕДВИЖИМОСТЬ', desc: 'Находим крутые объекты по пути, заезжаем к застройщикам, сканируем и упаковываем посёлки и комплексы в 3D.', foot: 'ОБЪЕКТЫ ПО МАРШРУТУ' },
    { code: 'LINE 04 · SOUND', accent: '#E5372C', title: 'МУЗЫКА', desc: 'Пишем треки прямо в дороге: студия на колёсах, процесс в кадре, премьеры — только в прямом эфире.', foot: 'ПРЕМЬЕРЫ — ТОЛЬКО LIVE' },
    { code: 'LINE 05 · CARS', accent: '#FF5A4B', title: 'ТАЧКИ', desc: 'Ищем редкие машины, берём дёшево, восстанавливаем, охотимся за запчастями — и показываем всё от сделки до первого выезда.', foot: 'ГАРАЖ ОБНОВЛЯЕТСЯ LIVE' },
    { code: 'LINE 06 · GOOD', accent: '#5AA9FF', title: 'ДОБРЫЕ ДЕЛА', desc: 'Помогаем соотечественникам, попавшим в беду: документы, билеты, больницы. Каждый рубль — в открытом отчёте.', foot: 'КАЖДЫЙ ЭТАП' },
  ],
  plTitle: 'Места, которые мы посетим', plSub: '19 ТОЧЕК · 7 ОПОРНЫХ',
  places: [
    { name: 'Пхукет', day: 'D01', tag: 'REALTY', tagCol: '#ECE9E4', desc: 'Старт протокола. Первые показы вилл GTR Realty и запись нулевого трека.', ph: 'ПХУКЕТ' },
    { name: 'Самуи', day: 'D05', tag: 'REALTY', tagCol: '#ECE9E4', desc: 'Виллы с видом на залив. Осмотр объектов в эфире, разбор цен без агентского тумана.', ph: 'САМУИ' },
    { name: 'Панган', day: 'D08', tag: 'RAW', tagCol: '#FF6A5B', desc: 'Ночь без сценария. Закрытая вечеринка клуба — локация упадёт за 3 часа.', ph: 'ПАНГАН' },
    { name: 'Чиангмай', day: 'D27', tag: 'SPIRIT', tagCol: '#8E8C94', desc: 'Столица духа: храмы, разговоры с монахами, практика на рассвете в горах.', ph: 'ЧИАНГМАЙ' },
    { name: 'Аюттайя', day: 'D33', tag: 'SPIRIT', tagCol: '#8E8C94', desc: 'Древняя столица. Места силы среди руин — трансформационный вечер этапа.', ph: 'АЮТТАЙЯ' },
    { name: 'Бангкок', day: '', tag: 'SOUND', tagCol: '#FF6A5B', desc: 'Студия, премьера трека тура и рынки запчастей — охота за деталями для гаража.', ph: 'БАНГКОК' },
    { name: 'Паттайя', day: '', tag: 'CARS', tagCol: '#FF5A4B', desc: 'Тачки, ночь и море: смотрим машины у частников, тест-драйвы, разъёб на побережье.', ph: 'ПАТТАЙЯ' },
  ],
  invKicker: 'ГОСТЕПРИИМСТВО · ПРОТОКОЛ ГОСТЯ', invTitle: 'Прими экипаж в гости',
  invLead: 'Живёшь по маршруту? Пригласи нас: покажи своё место силы, виллу, студию — или просто накрой стол. Гостеприимство попадает в прямой эфир, и тебя увидит вся аудитория тура.',
  invPoints: [
    { n: '01', txt: 'Визит выходит в прямой эфир с геометкой и упоминанием.' },
    { n: '02', txt: 'Точки выбирает экипаж — голосованием зрителей и жребием.' },
    { n: '03', txt: 'Лучший приём этапа получает слот в титрах финала.' },
  ],
  invFName: 'Имя / ник', invFPlace: 'Где ты на маршруте (город)', invFOffer: 'ЧТО ПОКАЖЕШЬ',
  invOfferList: ['Место силы', 'Недвижимость', 'Тачка / гараж', 'Вечеринка', 'Стол / ужин', 'Студия / музыка'],
  invFContact: 'Telegram / телефон', invFMsg: 'Пара слов — что нас ждёт',
  invSendBtn: 'ПРИГЛАСИТЬ ЭКИПАЖ →', invNote: 'Заявка уходит экипажу в консоль. Ответ — в течение 24 часов.',
  toastInv: 'Заявка принята. Экипаж свяжется с тобой.', invErr: 'Заполни имя и контакт.',
  qToast: 'Принято! Уровень комфорта экипажа растёт.',
  comfortLbl: 'КОМФОРТ ЭТАПА · ДОНАТ-ШКАЛА', comfortLvls: ['СПАЛЬНИК', 'ГЕСТХАУС', 'ОТЕЛЬ 4★', 'ВИЛЛА'],
  quizLbl: 'КВИЗ ЭТАПА · ГОЛОС РЕШАЕТ',
  cityQuiz: [
    { q: 'Где открываем тур?', opts: ['Большой Будда на рассвете', 'Виллы Банг Тао', 'Ночной Патонг'], goal: 20000 },
    { q: 'Какой объект показать изнутри?', opts: ['Вилла у моря', 'Дом в джунглях', 'Пентхаус с руфтопом'], goal: 25000 },
    { q: 'Формат закрытой ночи?', opts: ['Пляж и огонь', 'Вилла-приват', 'Джангл-рейв'], goal: 30000 },
    { q: 'Практика на рассвете?', opts: ['Медитация с монахами', 'Подъём на Дои Сутеп', 'Утренний алмс-раунд'], goal: 20000 },
    { q: 'Где трансформационный вечер?', opts: ['Руины на закате', 'Берег реки', 'Старый храм'], goal: 18000 },
    { q: 'Что делаем в Бангкоке?', opts: ['Руфтоп-премьера трека', 'Рынок запчастей', 'Эфир из студии'], goal: 30000 },
    { q: 'Какую тачку смотрим в Паттайе?', opts: ['Японская классика', 'Американский мускул', 'Европейское купе'], goal: 30000 },
  ],
  chTitle: 'КАНАЛЫ ЭФИРА', chHint: 'впиши хэндлы — плееры включатся сразу', chSave: 'СОХРАНИТЬ КАНАЛЫ',
  chToast: 'Каналы подключены', chOpenLbl: 'НАСТРОИТЬ КАНАЛЫ',
  chEmptyNote: 'Канал не подключён. Открой «Настроить каналы», впиши хэндл — плеер появится здесь.',
  chLinkNote: 'Платформа не отдаёт встраиваемый live-плеер — эфир откроется на самой платформе.',
  chWatchBtn: 'ОТКРЫТЬ ЭФИР ↗', shareLbl: 'ПОДЕЛИТЬСЯ ЭФИРОМ:', toastCopied: 'Ссылка скопирована',
  nav: [['route', 'Маршрут'], ['events', 'Афиша'], ['rig', 'Борт'], ['live', 'Эфир'], ['cars', 'Тачки'], ['realty', 'Объекты'], ['scales', 'Весы'], ['places', 'Места'], ['crew', 'Экипаж']],
  carsKicker: 'LINE 05 · CARS', carsTitle: 'Охота за редкими тачками',
  carsLead: 'По пути ищем редкие машины: японская классика, забытые купе, проекты из гаражей. Берём дёшево, восстанавливаем, охотимся за запчастями по рынкам Бангкока и Паттайи — и показываем каждый шаг в эфире.',
  carsSteps: [
    { t: 'Найти', d: 'Наводки зрителей, рынки, объявления, гаражи по маршруту.' },
    { t: 'Купить', d: 'Торг в эфире. Цена сделки — в открытом журнале.' },
    { t: 'Восстановить', d: 'Мастерские Чиангмая и Бангкока, работа в кадре.' },
    { t: 'Запчасти', d: 'Охота за деталями: разборки, рынки, доноры.' },
    { t: 'Показать', d: 'Финальный выезд, тест-драйв и судьба машины.' },
  ],
  carsGarage: 'ГАРАЖ ТУРА', carsEmpty: 'Гараж пока пуст. Первая находка появится здесь в день, когда экипаж её купит.',
  carStages: { hunt: 'ОХОТА', bought: 'КУПЛЕНА', restore: 'В РАБОТЕ', parts: 'ЖДЁМ ЗАПЧАСТИ', done: 'ГОТОВА', sold: 'ПРОДАНА' },
  carsTipTitle: 'Знаешь тачку?', carsTipLead: 'Подкинь наводку — если машину купим, твоё имя будет в эфире и в гараже.',
  carsTipCar: 'Что за машина (марка, модель, год)', carsTipWhere: 'Где стоит (город)', carsTipPrice: 'Цена, если знаешь',
  carsTipContact: 'Telegram / телефон', carsTipBtn: 'ОТПРАВИТЬ НАВОДКУ', carsTipOk: 'Наводка у экипажа. Спасибо!', carsTipErr: 'Опиши машину и оставь контакт.',
  chatTitle: 'ЧАТ ЭФИРА', chatNick: 'Твой ник', chatMsg: 'Написать в эфир…', chatSend: 'ОТПР', chatOnline: 'в чате',
  chatSlow: 'Не так быстро — подожди пару секунд', chatMuted: 'Модератор ограничил тебе чат на сутки', chatEmpty: 'Чат открыт. Напиши первым.', chatOffline: 'Переподключаемся…',
  routeKicker: 'LIVE-ТРЕКИНГ', routeTitle: 'Маршрут', liveKicker: 'ПРЯМОЙ ЭФИР', liveTitle2: 'Эфир и чат', soonBig: 'СКОРО', dayOf: 'из',
};

const EN: Dict = {
  tagline: 'NEW ERA. NEW RULES. NEW YOU.',
  heroA: 'The Thailand loop.', heroB: 'Streaming live.',
  heroSub: 'ILIA and GTR drive the loop Phuket → Samui → Phangan → Chiang Mai → Ayutthaya → Bangkok → Pattaya → Phuket. Cars, real estate, good deeds and wild nights — unedited, with a live map and chat.',
  ctaWatch: 'WATCH LIVE', ctaJoin: 'JOIN THE CREW',
  sDays: 'DAYS ON THE ROAD', sKm: 'KM AROUND THE LOOP', sBases: 'CITIES + 3 FERRIES', sSpots: 'PLACES OF POWER',
  cdTitle: 'PROTOCOL STARTS IN', cdD: 'DAYS', cdH: 'HRS', cdM: 'MIN', cdS: 'SEC',
  liveTitle: 'PROTOCOL ACTIVE', doneTitle: 'PROTOCOL COMPLETE', dayWord: 'DAY', kmUnit: 'KM',
  startLabel: 'START: 01.08.2026 · 09:00 ICT · PHUKET',
  mapTitle: '// LIVE ROUTE TRACKING', lgBase: 'base', lgFerry: 'ferry', lgDone: 'covered',
  srcGps: 'CREW GPS', srcPlan: 'SCHEDULE ESTIMATE',
  mapHint: 'Map © OpenStreetMap, OpenFreeMap. Position comes from the crew GPS; until there is a signal — an honest schedule-based estimate.',
  posWait: 'awaiting start',
  telTitle: '// PROTOCOL TELEMETRY', kmDoneW: 'COVERED ', telRoute: 'ROUTE', telStage: 'LEG',
  telStatus: 'STATUS', telNext: 'NEXT POINT', statusPlan: 'ON SCHEDULE', minAgo: 'min ago', hrAgo: 'h ago',
  statuses: { drive: 'DRIVING', base: 'AT BASE', ferry: 'FERRY', live: 'ON AIR', stop: 'STOPPED' },
  finishWord: 'FINISH — PHUKET',
  streamTitle: '// LIVE FEED', standby: 'SIGNAL: STANDBY',
  firstStream: 'First shoot — Bangla Road, Patong · on start day',
  liveNote: 'Streaming right now — pick a platform below', liveNow: 'LIVE NOW', watchOn: 'WATCH ON',
  schedTitle: 'SCHEDULE (ICT)',
  sched: [['09:00', 'ROAD RUN — live from the car'], ['18:30', 'SUNSET — place of power of the day'], ['22:00', 'DEBRIEF — Protocol club only']],
  boostTitle: '// BOOST GOAL #2', boostName: 'Drone for road-run shots',
  boostNote: 'Every donation puts your name in the daily credits and gets the drone in the air.',
  donate: 'DONATE',
  jrTitle: 'CREW LOGBOOK', jrSub: 'POSTS, HYPOTHESES AND FIELD NOTES — STRAIGHT FROM THE CREW CONSOLE',
  jrOpen: 'CREW CONSOLE →',
  jrEmptyTxt: 'The logbook is empty. Posts, hypotheses and field notes will appear here as soon as the crew publishes them in the console — entries persist and fan out via webhooks.',
  jrTypes: { post: 'POST', mat: 'MATERIAL', hyp: 'HYPOTHESIS', obs: 'FIELD NOTE' }, jrLink: 'MATERIAL →',
  tiersTitle: 'ACCESS LEVELS', tiersSub: 'SUBSCRIPTION UNLOCKS WHAT NEVER REACHES THE PUBLIC STREAM',
  perMonth: '/MO', popular: 'CREW PICK', choose: 'ACTIVATE',
  tiers: [
    { name: 'OBSERVER', price: 99, desc: 'Watch deeper', perks: ['Unrestricted stream chat', 'Zero-delay map and telemetry', 'Weekly route digest'] },
    { name: 'CREW', price: 399, desc: 'Ride with us', perks: ['Everything in Observer', 'Private «Protocol» channel', 'Route points before they go public', 'Vote on tomorrow’s route'] },
    { name: 'PROTOCOL Ω', price: 1499, desc: 'Shape the route', perks: ['Everything in Crew', 'Monthly call with the crew', 'Your name in the final film credits', 'Set the spot of the day', 'Capped at 100 seats'] },
  ],
  clubTitle: 'INSIDE THE PRIVATE «PROTOCOL» CHANNEL',
  club: ['Raw phone drops — every day', 'Coordinates of power spots before the stream', 'Fails that never go public', 'Voice debrief after every road run'],
  tlTitle: '8 POINTS OF THE LOOP', tlSub: 'STATUS UPDATES AUTOMATICALLY',
  stWait: 'PENDING', stActive: 'EN ROUTE', stDone: 'CLEARED',
  crewTitle: 'THE CREW',
  crew: [
    { name: 'ILIA', role: 'VOICE OF PROTOCOL', desc: 'Streams, talk, meaning. Keeps the line to the audience open from any point of the route.', ph: 'ILIA photo — drop here' },
    { name: 'GTR', role: 'MEMBER 02 · IDENTITY CLASSIFIED', desc: 'The femme fatale of Bavarian premium. A story worth hearing, a thing for bolts, oil and adventure. Who she is — you’ll see on stream.', ph: 'GTR photo — drop here' },
    { name: 'NEW MEMBER', role: 'OPERATOR', desc: 'Camera, on-the-fly editing, drone. The protocol’s third eye — shoots what the crew doesn’t see.', ph: 'operator photo — drop here' },
  ],
  spTitle: 'SPONSOR SLOTS', spSub: 'INTEGRATIONS: CAR LIVERY · STREAM OVERLAY · JINGLE · NATIVE ROUTE SPOTS',
  spFree: '// OPEN', spCta: 'CLAIM A SLOT →', spPh: 'partner logo',
  f1: 'BANGTAOSTYLE.COM · PROTOCOL 10.10 · ALL SYSTEMS SYNCHRONIZED',
  f2: 'ILIA · GTR — Thailand, autumn 2026. Finish on Phuket, 15 November.',
  bootInit: 'PROTOCOL INITIALIZATION', bootSkip: 'CLICK TO SKIP',
  toastPay: 'Opening payment in a new tab',
  statusSoon: 'SOON', statusLive: 'LIVE', statusDone: 'DONE', consoleLink: 'CONSOLE',
  gtrTitle: 'Reality-management capabilities',
  gtrLead: 'GTR is not car tuning. It is a transformation protocol. Along the route — transformation evenings, deep-dives and closed parties. We discuss change live: your participation and votes decide where we are tomorrow.',
  gtrCards: [
    { code: 'RITUAL 01', title: 'Transformation evenings', desc: 'Live gatherings along the route: deep-dives, practices, honest talk about change.' },
    { code: 'RITUAL 02', title: 'Closed parties', desc: 'Club only. Location drops hours before. If you are in — you are in.' },
    { code: 'RITUAL 03', title: 'Your vote decides', desc: 'Where we drive, where we stop, what we unpack on stream — the audience votes.' },
  ],
  gtrGoodCode: 'KARMA · GOOD PROTOCOL', gtrGoodTitle: 'Who we help today — fate decides',
  gtrGoodDesc: 'A share of each leg’s donations goes to good. The recipient is drawn by lot, live on camera — honest, unscripted.',
  gtrForms: [
    { variant: 'chedi', label: 'FORM 02 · CHEDI · SIGNAL RISING' },
    { variant: 'wai', label: 'FORM 03 · WAI · GRATITUDE PROTOCOL' },
    { variant: 'church', label: 'FORM 04 · SOBOR · UNITY SIGNAL' },
    { variant: 'ilia', label: 'FORM 05 · ILIA · PILOT SIGNAL' },
  ],
  lnTitle: 'Content lines', lnSub: '6 STREAMS · ONE FEED',
  lines: [
    { code: 'LINE 01 · SPIRIT', accent: '#8E8C94', title: 'SPIRIT', desc: 'The tour’s real spiritual life: temples, monks, dawn practices, places of power — no gloss, no staging.', foot: 'EVERY MORNING, LIVE' },
    { code: 'LINE 02 · RAW', accent: '#E5372C', title: 'MAYHEM', desc: 'Closed parties and unscripted nights. The camera stays on. What happens live, stays live.', foot: 'LOCATION DROPS 3H BEFORE' },
    { code: 'LINE 03 · REALTY', accent: '#ECE9E4', title: 'REALTY', desc: 'We find the best properties on the way, visit developers, scan and package villages and complexes in 3D.', foot: 'PROPERTIES ON THE ROUTE' },
    { code: 'LINE 04 · SOUND', accent: '#E5372C', title: 'MUSIC', desc: 'We write tracks on the road: a studio on wheels, the process on camera, premieres — live only.', foot: 'PREMIERES — LIVE ONLY' },
    { code: 'LINE 05 · CARS', accent: '#FF5A4B', title: 'CARS', desc: 'We hunt rare cars, buy cheap, restore, chase parts — and show it all from the deal to the first drive.', foot: 'GARAGE UPDATES LIVE' },
    { code: 'LINE 06 · GOOD', accent: '#5AA9FF', title: 'GOOD DEEDS', desc: 'We help compatriots in trouble: documents, tickets, hospitals. Every coin in an open report.', foot: 'EVERY LEG' },
  ],
  plTitle: 'Places we will visit', plSub: '19 POINTS · 7 ANCHORS',
  places: [
    { name: 'Phuket', day: 'D01', tag: 'REALTY', tagCol: '#ECE9E4', desc: 'Protocol start. First GTR Realty villa viewings and track zero recording.', ph: 'PHUKET' },
    { name: 'Samui', day: 'D05', tag: 'REALTY', tagCol: '#ECE9E4', desc: 'Villas over the gulf. Live property viewings, honest price breakdowns.', ph: 'SAMUI' },
    { name: 'Phangan', day: 'D08', tag: 'RAW', tagCol: '#FF6A5B', desc: 'An unscripted night. Closed club party — location drops 3 hours before.', ph: 'PHANGAN' },
    { name: 'Chiang Mai', day: 'D27', tag: 'SPIRIT', tagCol: '#8E8C94', desc: 'Capital of spirit: temples, talks with monks, dawn practice in the mountains.', ph: 'CHIANG MAI' },
    { name: 'Ayutthaya', day: 'D33', tag: 'SPIRIT', tagCol: '#8E8C94', desc: 'The ancient capital. Places of power among the ruins — the leg’s transformation evening.', ph: 'AYUTTHAYA' },
    { name: 'Bangkok', day: '', tag: 'SOUND', tagCol: '#FF6A5B', desc: 'Studio, the tour track premiere and parts markets — hunting components for the garage.', ph: 'BANGKOK' },
    { name: 'Pattaya', day: '', tag: 'CARS', tagCol: '#FF5A4B', desc: 'Cars, nights and the sea: private sellers, test drives, a wild night on the coast.', ph: 'PATTAYA' },
  ],
  invKicker: 'HOSPITALITY · GUEST PROTOCOL', invTitle: 'Host the crew',
  invLead: 'Live along the route? Invite us: show your place of power, villa, studio — or just set the table. Hospitality goes out live, and the whole tour audience sees you.',
  invPoints: [
    { n: '01', txt: 'The visit streams live with a geotag and a mention.' },
    { n: '02', txt: 'The crew picks stops by audience vote and by lot.' },
    { n: '03', txt: 'Best welcome of the leg gets a slot in the finale credits.' },
  ],
  invFName: 'Name / handle', invFPlace: 'Where you are on the route (city)', invFOffer: 'WHAT YOU WILL SHOW',
  invOfferList: ['Place of power', 'Real estate', 'Car / garage', 'Party', 'Dinner table', 'Studio / music'],
  invFContact: 'Telegram / phone', invFMsg: 'A few words — what awaits us',
  invSendBtn: 'INVITE THE CREW →', invNote: 'The request goes to the crew console. Reply within 24 hours.',
  toastInv: 'Request received. The crew will contact you.', invErr: 'Fill in name and contact.',
  qToast: 'Received! Crew comfort level rising.',
  comfortLbl: 'LEG COMFORT · DONATION SCALE', comfortLvls: ['SLEEPING BAG', 'GUESTHOUSE', '4★ HOTEL', 'VILLA'],
  quizLbl: 'LEG QUIZ · YOUR VOTE DECIDES',
  cityQuiz: [
    { q: 'Where do we open the tour?', opts: ['Big Buddha at dawn', 'Bang Tao villas', 'Patong at night'], goal: 20000 },
    { q: 'Which object do we show inside?', opts: ['Seafront villa', 'Jungle house', 'Rooftop penthouse'], goal: 25000 },
    { q: 'Closed-night format?', opts: ['Beach and fire', 'Private villa', 'Jungle rave'], goal: 30000 },
    { q: 'Dawn practice?', opts: ['Meditation with monks', 'Doi Suthep climb', 'Morning alms round'], goal: 20000 },
    { q: 'Where is the transformation evening?', opts: ['Ruins at sunset', 'Riverside', 'Old temple'], goal: 18000 },
    { q: 'What do we do in Bangkok?', opts: ['Rooftop track premiere', 'Parts market', 'Studio stream'], goal: 30000 },
    { q: 'Which car do we check out in Pattaya?', opts: ['Japanese classic', 'American muscle', 'European coupé'], goal: 30000 },
  ],
  chTitle: 'LIVE CHANNELS', chHint: 'enter handles — players go live instantly', chSave: 'SAVE CHANNELS',
  chToast: 'Channels connected', chOpenLbl: 'SET UP CHANNELS',
  chEmptyNote: 'Channel not connected. Open “Set up channels”, enter a handle — the player appears here.',
  chLinkNote: 'This platform has no embeddable live player — the stream opens on the platform itself.',
  chWatchBtn: 'OPEN STREAM ↗', shareLbl: 'SHARE THE STREAM:', toastCopied: 'Link copied',
  nav: [['route', 'Route'], ['events', 'Events'], ['rig', 'Rig'], ['live', 'Live'], ['cars', 'Cars'], ['realty', 'Realty'], ['scales', 'Scales'], ['places', 'Places'], ['crew', 'Crew']],
  carsKicker: 'LINE 05 · CARS', carsTitle: 'Hunting rare cars',
  carsLead: 'Along the way we hunt rare cars: Japanese classics, forgotten coupés, garage projects. We buy cheap, restore, chase parts across the markets of Bangkok and Pattaya — and stream every step.',
  carsSteps: [
    { t: 'Find', d: 'Viewer tips, markets, listings, garages along the route.' },
    { t: 'Buy', d: 'Haggling on stream. The deal price goes in the open log.' },
    { t: 'Restore', d: 'Workshops in Chiang Mai and Bangkok, all on camera.' },
    { t: 'Parts', d: 'Chasing parts: breakers, markets, donor cars.' },
    { t: 'Show', d: 'The final run, a test drive and the car’s fate.' },
  ],
  carsGarage: 'TOUR GARAGE', carsEmpty: 'The garage is empty for now. The first find shows up here the day the crew buys it.',
  carStages: { hunt: 'HUNTING', bought: 'BOUGHT', restore: 'IN THE SHOP', parts: 'WAITING FOR PARTS', done: 'READY', sold: 'SOLD' },
  carsTipTitle: 'Know a car?', carsTipLead: 'Send a tip — if we buy it, your name goes on stream and in the garage.',
  carsTipCar: 'What car (make, model, year)', carsTipWhere: 'Where it is (city)', carsTipPrice: 'Price, if you know it',
  carsTipContact: 'Telegram / phone', carsTipBtn: 'SEND THE TIP', carsTipOk: 'The crew has your tip. Thanks!', carsTipErr: 'Describe the car and leave a contact.',
  chatTitle: 'STREAM CHAT', chatNick: 'Your nickname', chatMsg: 'Say something…', chatSend: 'SEND', chatOnline: 'in chat',
  chatSlow: 'Slow down — wait a couple of seconds', chatMuted: 'A moderator muted you for a day', chatEmpty: 'Chat is open. Be the first.', chatOffline: 'Reconnecting…',
  routeKicker: 'LIVE TRACKING', routeTitle: 'The route', liveKicker: 'LIVE', liveTitle2: 'Stream & chat', soonBig: 'SOON', dayOf: 'of',
};

export function getDict(lang: 'ru' | 'en'): Dict {
  return lang === 'ru' ? RU : EN;
}

// Per-city photo slideshow sources (order matches Dict.places / cityQuiz).
export const PLACE_SRCS: string[][] = [
  ['assets/places/phuket/01-big-buddha.jpg', 'assets/places/phuket/05-neon-night.jpg', 'assets/places/phuket/02-longtail-sunset.jpg', 'assets/places/phuket/04-villas.jpg', 'assets/places/phuket/03-aerial-beach.jpg'],
  ['assets/places/samui/01-scene.jpg', 'assets/places/samui/02-scene.jpg', 'assets/places/samui/03-scene.jpg'],
  ['assets/places/phangan/01-scene.jpg', 'assets/places/phangan/02-scene.jpg', 'assets/places/phangan/03-scene.jpg'],
  ['assets/places/chiangmai/01-scene.jpg', 'assets/places/chiangmai/02-scene.jpg', 'assets/places/chiangmai/03-scene.jpg'],
  ['assets/places/ayutthaya/01-scene.jpg', 'assets/places/ayutthaya/02-scene.jpg', 'assets/places/ayutthaya/03-scene.jpg'],
  ['assets/places/bangkok/01-scene.jpg', 'assets/places/bangkok/02-scene.jpg', 'assets/places/bangkok/03-scene.jpg'],
  ['assets/places/pattaya/01-scene.jpg', 'assets/places/pattaya/02-scene.jpg', 'assets/places/pattaya/03-scene.jpg'],
];
