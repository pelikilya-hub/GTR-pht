import { useEffect, useState } from 'react'
import { tripStatus } from '@/lib/trip'

export function StatusBar() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const status = tripStatus(now)

  return (
    <div className="relative flex flex-wrap items-center gap-x-6 gap-y-2 rounded-md border border-border/70 bg-card/60 px-4 py-3 font-mono-tech text-[11px] uppercase tracking-[0.18em] text-muted-foreground backdrop-blur-sm">
      <span className="inline-flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
        </span>
        <span className="text-primary">
          {status.phase === 'before' && 'Протокол · ожидание'}
          {status.phase === 'active' && 'Протокол активен'}
          {status.phase === 'after' && 'Протокол завершён'}
        </span>
      </span>

      {status.phase === 'before' && (
        <span>До старта протокола · {status.daysLeft} дн.</span>
      )}
      {status.phase === 'active' && (
        <>
          <span>
            День {status.dayNumber} из {status.totalDays}
          </span>
          <span>
            Текущая точка · {status.currentStage ? status.currentStage.city : 'в пути'}
          </span>
        </>
      )}
      {status.phase === 'after' && <span>{status.totalDays} дней пройдено · маршрут закрыт</span>}

      <span className="ml-auto text-muted-foreground/70 normal-case tracking-normal">
        20 июля — 27 августа 2026 · Пхукет → Бангкок
      </span>
    </div>
  )
}
