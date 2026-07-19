import type { ReactNode } from 'react'
import { BedDouble, Compass, Leaf, Route, Users } from 'lucide-react'
import type { Stage } from '@/data/route'
import { budgetRule } from '@/data/route'
import { stageDurationDays } from '@/lib/trip'

function Block({
  icon,
  title,
  accent,
  children,
}: {
  icon: ReactNode
  title: string
  accent: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-border/60 bg-background/40 p-4">
      <div className="flex items-center gap-2">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full"
          style={{ backgroundColor: `${accent}22`, color: accent }}
        >
          {icon}
        </span>
        <h4 className="font-mono-tech text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          {title}
        </h4>
      </div>
      {children}
    </div>
  )
}

export function StageSection({ stage, reverse }: { stage: Stage; reverse?: boolean }) {
  return (
    <section
      id={stage.id}
      className="scroll-mt-20 rounded-lg border border-border/70 bg-card/40 p-5 sm:p-8"
    >
      <div className={`flex flex-col gap-6 ${reverse ? 'sm:flex-row-reverse' : 'sm:flex-row'}`}>
        <div className="flex shrink-0 flex-col gap-2 sm:w-56">
          <span className="font-mono-tech text-xs text-accent">
            {String(stage.index).padStart(2, '0')} / {String(6).padStart(2, '0')}
          </span>
          <h3 className="font-display text-3xl text-foreground">{stage.city}</h3>
          <span className="text-sm text-muted-foreground">{stage.region}</span>
          <div className="mt-2 flex flex-col gap-1 font-mono-tech text-[11px] uppercase tracking-wide text-muted-foreground">
            <span className="text-primary">{stage.dateLabel}</span>
            <span>{stageDurationDays(stage)} дней на месте</span>
          </div>
          <div className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <Route className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
            <span>{stage.transportIn}</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-5">
          <p className="text-sm leading-relaxed text-foreground/90 sm:text-base">{stage.summary}</p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Block icon={<BedDouble className="h-4 w-4" />} title={`Жильё · до ${budgetRule.rub}₽ / ${budgetRule.thb}฿`} accent="#d9a441">
              <ul className="flex flex-col gap-2 text-sm">
                {stage.stayAreas.map((a) => (
                  <li key={a.area}>
                    <span className="font-medium text-foreground">{a.area}</span>
                    <span className="block text-xs text-muted-foreground">{a.note}</span>
                  </li>
                ))}
              </ul>
            </Block>

            <Block icon={<Compass className="h-4 w-4" />} title="Места силы" accent="#2fb6a8">
              <ul className="flex flex-col gap-2 text-sm">
                {stage.energyPlaces.map((p) => (
                  <li key={p.name}>
                    <span className="font-medium text-foreground">{p.name}</span>
                    <span className="block text-xs text-muted-foreground">{p.note}</span>
                  </li>
                ))}
              </ul>
            </Block>

            <Block icon={<Leaf className="h-4 w-4" />} title="Каннабис-фермы" accent="#e2725b">
              <ul className="flex flex-col gap-2 text-sm">
                {stage.cannabis.map((c) => (
                  <li key={c.name}>
                    <span className="font-medium text-foreground">{c.name}</span>
                    <span className="block text-xs text-muted-foreground">{c.note}</span>
                  </li>
                ))}
              </ul>
            </Block>

            <Block icon={<Users className="h-4 w-4" />} title="Русскоязычное комьюнити" accent="#8aa872">
              <p className="text-sm leading-relaxed text-muted-foreground">{stage.community}</p>
            </Block>
          </div>
        </div>
      </div>
    </section>
  )
}
