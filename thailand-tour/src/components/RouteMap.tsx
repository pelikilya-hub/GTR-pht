import { stages } from '@/data/route'

const pathD = stages
  .map((s, i) => `${i === 0 ? 'M' : 'L'} ${s.x} ${s.y}`)
  .join(' ')

export function RouteMap() {
  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-border/70 bg-card/40">
      <div className="relative aspect-[10/11] w-full sm:aspect-[16/10]">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="land" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#16261d" />
              <stop offset="100%" stopColor="#0f1d16" />
            </linearGradient>
          </defs>
          {/* schematic landmass, not to scale */}
          <path
            d="M22 4 C 16 10, 14 18, 18 24 C 12 30, 10 36, 16 42
               C 10 48, 8 54, 14 60 C 8 66, 6 72, 12 80
               C 8 86, 10 92, 18 96 L 30 94 C 34 88, 32 82, 38 78
               C 36 70, 40 64, 46 60 C 42 52, 46 46, 52 42
               C 48 34, 52 28, 58 26 C 52 20, 48 14, 40 10
               C 34 6, 28 4, 22 4 Z"
            fill="url(#land)"
            stroke="#213228"
            strokeWidth="0.4"
          />
          <path
            d={pathD}
            fill="none"
            stroke="#d9a441"
            strokeWidth="0.6"
            strokeDasharray="2 1.4"
            strokeLinecap="round"
            opacity="0.85"
          />
        </svg>

        {stages.map((s) => (
          <div
            key={s.id}
            className="group absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${s.x}%`, top: `${s.y}%` }}
          >
            <div className="relative flex flex-col items-center">
              <span className="absolute h-6 w-6 animate-pulse-soft rounded-full bg-primary/20" />
              <span className="relative flex h-6 w-6 items-center justify-center rounded-full border border-primary/70 bg-background font-mono-tech text-[10px] text-primary shadow-[0_0_0_3px_rgba(0,0,0,0.35)]">
                {s.index}
              </span>
              <div className="pointer-events-none absolute top-7 z-10 w-max max-w-[9.5rem] rounded border border-border/70 bg-card px-2 py-1 text-center opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 sm:max-w-[11rem]">
                <div className="font-display text-xs text-foreground">{s.city}</div>
                <div className="font-mono-tech text-[9px] uppercase tracking-wide text-muted-foreground">
                  {s.dateLabel}
                </div>
              </div>
              <span className="mt-1 max-w-[4.5rem] text-center font-mono-tech text-[8px] uppercase leading-tight tracking-wide text-muted-foreground sm:max-w-none sm:text-[9px]">
                {s.city}
              </span>
            </div>
          </div>
        ))}
      </div>
      <p className="border-t border-border/60 px-4 py-2 font-mono-tech text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        Схематичная карта маршрута · не в масштабе · наведи на точку для дат
      </p>
    </div>
  )
}
