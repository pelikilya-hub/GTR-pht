import { StatusBar } from '@/components/StatusBar'

const stats = [
  { label: 'дней в пути', value: '39' },
  { label: 'точек маршрута', value: '6' },
  { label: 'бюджет ночи', value: '≤2000₽' },
  { label: 'мест силы', value: '16+' },
]

export function Hero() {
  return (
    <header className="relative overflow-hidden border-b border-border/60">
      <svg
        className="absolute inset-0 h-full w-full opacity-90"
        viewBox="0 0 1200 640"
        preserveAspectRatio="xMidYMax slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0c1713" />
            <stop offset="55%" stopColor="#0e1a15" />
            <stop offset="100%" stopColor="#132018" />
          </linearGradient>
          <radialGradient id="sun" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f2c369" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#d9a441" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#d9a441" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="1200" height="640" fill="url(#sky)" />
        <circle cx="920" cy="150" r="220" fill="url(#sun)" />
        <circle cx="920" cy="150" r="58" fill="#f2c369" opacity="0.85" />
        {/* distant ridge */}
        <path
          d="M0 420 L120 380 L260 410 L360 360 L480 400 L620 350 L740 395 L860 370 L980 405 L1100 375 L1200 400 L1200 640 L0 640 Z"
          fill="#16261d"
          opacity="0.9"
        />
        {/* near ridge */}
        <path
          d="M0 470 L140 430 L300 460 L420 415 L560 455 L700 410 L840 450 L980 420 L1120 455 L1200 435 L1200 640 L0 640 Z"
          fill="#0f1d16"
        />
        {/* water sparkle line */}
        <path
          d="M0 520 Q300 505 600 520 T1200 520"
          stroke="#2fb6a8"
          strokeOpacity="0.35"
          strokeWidth="1.5"
          fill="none"
        />
      </svg>

      <div className="relative mx-auto flex max-w-5xl flex-col gap-8 px-6 pb-10 pt-14 sm:pt-20">
        <div className="flex flex-col gap-4">
          <span className="font-mono-tech text-[11px] uppercase tracking-[0.3em] text-accent">
            Протокол Ω · маршрут ILIA
          </span>
          <h1 className="font-display text-balance text-4xl leading-[1.05] text-foreground sm:text-6xl">
            Пхукет → Самуи → Панган → Краби → Чиангмай → Бангкок
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            39 дней по местам силы Таиланда: бюджетные ночёвки не дороже{' '}
            <span className="text-primary">2000&nbsp;₽ / 1000&nbsp;฿</span>, легальные каннабис-фермы
            с разговорами напрямую с гроверами и русскоязычные комьюнити в каждой точке маршрута —
            от риэлторских чатов до экспат-встреч.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-md border border-border/70 bg-card/50 px-4 py-3 backdrop-blur-sm"
            >
              <div className="whitespace-nowrap break-normal font-display text-lg text-primary sm:text-2xl">{s.value}</div>
              <div className="font-mono-tech text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        <StatusBar />
      </div>
    </header>
  )
}
