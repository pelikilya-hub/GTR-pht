import { Hero } from '@/components/Hero'
import { RouteMap } from '@/components/RouteMap'
import { Timeline } from '@/components/Timeline'
import { StageSection } from '@/components/StageSection'
import { Logistics } from '@/components/Logistics'
import { Footer } from '@/components/Footer'
import { stages } from '@/data/route'

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono-tech text-[11px] uppercase tracking-[0.24em] text-accent">
        {eyebrow}
      </span>
      <h2 className="font-display text-2xl text-foreground sm:text-3xl">{title}</h2>
    </div>
  )
}

function App() {
  return (
    <div className="min-h-screen">
      <Hero />

      <main className="mx-auto flex max-w-5xl flex-col gap-14 px-6 py-14">
        <section className="flex flex-col gap-5">
          <SectionTitle eyebrow="01 · Обзор" title="Маршрут по точкам" />
          <RouteMap />
          <Timeline />
        </section>

        <section className="flex flex-col gap-6">
          <SectionTitle eyebrow="02 · Разбор точек" title="Что делать на каждом отрезке" />
          <div className="flex flex-col gap-6">
            {stages.map((s, i) => (
              <StageSection key={s.id} stage={s} reverse={i % 2 === 1} />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-5">
          <SectionTitle eyebrow="03 · Логистика" title="Переезды, бюджет, погода и важное про каннабис" />
          <Logistics />
        </section>

        <Footer />
      </main>
    </div>
  )
}

export default App
