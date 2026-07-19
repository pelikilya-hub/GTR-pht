import { stages } from '@/data/route'
import { stageDurationDays } from '@/lib/trip'

export function Timeline() {
  return (
    <div className="flex snap-x gap-3 overflow-x-auto pb-2">
      {stages.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className="group flex w-[220px] shrink-0 snap-start flex-col gap-2 rounded-md border border-border/70 bg-card/50 p-4 transition-colors hover:border-primary/60 hover:bg-card"
        >
          <div className="flex items-center justify-between font-mono-tech text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            <span>{String(s.index).padStart(2, '0')}</span>
            <span>{stageDurationDays(s)} дн.</span>
          </div>
          <div className="font-display text-lg text-foreground group-hover:text-primary">
            {s.city}
          </div>
          <div className="text-xs text-muted-foreground">{s.dateLabel}</div>
          <div className="mt-1 text-xs leading-relaxed text-muted-foreground/90">{s.vibe}</div>
        </a>
      ))}
    </div>
  )
}
