import { CloudRain, Landmark, ShieldAlert, Wallet } from 'lucide-react'

const transportLegs = [
  { from: 'Пхукет', to: 'Ко Самуи', mode: 'минивэн + паром через Донсак', time: '≈ 7-8 ч' },
  { from: 'Ко Самуи', to: 'Ко Панган', mode: 'паром до Тонгсалы', time: '30-45 мин' },
  { from: 'Ко Панган', to: 'Краби/Ао Нанг', mode: 'паром + автобус (или ночной паром сезонно)', time: '≈ 8-10 ч' },
  { from: 'Краби', to: 'Чиангмай', mode: 'перелёт (обычно через Бангкок)', time: '≈ 2.5-4 ч' },
  { from: 'Чиангмай', to: 'Бангкок', mode: 'перелёт или ночной поезд', time: '1 ч / 12-13 ч' },
]

const weather = [
  { place: 'Пхукет / Краби (Андаманское море)', note: 'Юго-западный муссон в разгаре: тёплые ливни во второй половине дня, между ними солнце' },
  { place: 'Самуи / Панган (зал. Сиама)', note: 'Формально самый сухой сезон Гулфа — их «мокрый» сезон сдвинут на октябрь-декабрь' },
  { place: 'Чиангмай', note: 'Влажный сезон в горах, кратковременные ливни к вечеру, зелень в пике' },
  { place: 'Бангкок', note: 'Жарко и влажно, дневные грозы — стандартный городской муссон' },
]

export function Logistics() {
  return (
    <section className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-4 rounded-lg border border-border/70 bg-card/40 p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <Landmark className="h-4 w-4 text-accent" />
          <h3 className="font-mono-tech text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Переезды между точками
          </h3>
        </div>
        <ul className="flex flex-col gap-3 text-sm">
          {transportLegs.map((leg) => (
            <li key={`${leg.from}-${leg.to}`} className="flex flex-col gap-0.5 border-b border-border/40 pb-3 last:border-0 last:pb-0">
              <span className="font-medium text-foreground">
                {leg.from} → {leg.to}
              </span>
              <span className="text-xs text-muted-foreground">
                {leg.mode} · {leg.time}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-border/70 bg-card/40 p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-accent" />
          <h3 className="font-mono-tech text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Бюджет на жильё
          </h3>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-3xl text-primary">≤2000₽</span>
          <span className="text-sm text-muted-foreground">/ ≤1000฿ за ночь</span>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          При 38 ночах в пути это потолок ≈ 76&nbsp;000₽ на всё жильё маршрута — в реальности
          гестхаусы и бунгало вне пиковых дат чаще выходят на 500-800฿, так что фактический чек
          обычно ниже потолка. Бронируй с фильтром цены на Booking/Agoda и уточняй у местных
          русскоязычных чатов свежие варианты длительной аренды — часто дешевле, чем прайс на сайтах.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-border/70 bg-card/40 p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <CloudRain className="h-4 w-4 text-accent" />
          <h3 className="font-mono-tech text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Погода на даты трипа
          </h3>
        </div>
        <ul className="flex flex-col gap-2 text-sm">
          {weather.map((w) => (
            <li key={w.place}>
              <span className="font-medium text-foreground">{w.place}</span>
              <span className="block text-xs text-muted-foreground">{w.note}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-destructive/40 bg-destructive/10 p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-destructive" />
          <h3 className="font-mono-tech text-xs uppercase tracking-[0.14em] text-destructive">
            Каннабис · важно перед поездкой
          </h3>
        </div>
        <ul className="flex list-disc flex-col gap-2 pl-4 text-sm leading-relaxed text-foreground/90">
          <li>Таиланд декриминализировал каннабис в 2022 году, но регулирование продолжает меняться — перед поездкой сверь актуальные правила (лицензии, где можно курить, нужен ли рецепт).</li>
          <li>Посещай только лицензированные фермы и шопы, спрашивай документы у гроверов, если сомневаешься.</li>
          <li>Вывоз каннабиса за пределы Таиланда — в любую страну, включая транзит — остаётся серьёзным преступлением. Оставляй всё в стране.</li>
          <li>Употребление в общественных местах запрещено и штрафуется — практика только в частном пространстве по договорённости с фермой/отелем.</li>
        </ul>
      </div>
    </section>
  )
}
