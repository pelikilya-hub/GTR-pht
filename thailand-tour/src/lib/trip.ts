import { stages, TRIP_START, TRIP_END, type Stage } from '@/data/route'

const DAY = 24 * 60 * 60 * 1000

export function tripStatus(now: Date = new Date()) {
  const start = new Date(TRIP_START + 'T00:00:00')
  const end = new Date(TRIP_END + 'T23:59:59')
  const totalDays = Math.round((end.getTime() - start.getTime()) / DAY)

  if (now < start) {
    const daysLeft = Math.ceil((start.getTime() - now.getTime()) / DAY)
    return { phase: 'before' as const, daysLeft, totalDays }
  }
  if (now > end) {
    return { phase: 'after' as const, totalDays }
  }
  const dayNumber = Math.floor((now.getTime() - start.getTime()) / DAY) + 1
  const currentStage = currentStageFor(now)
  return { phase: 'active' as const, dayNumber, totalDays, currentStage }
}

export function currentStageFor(now: Date = new Date()): Stage | null {
  for (const stage of stages) {
    const s = new Date(stage.dateStart + 'T00:00:00')
    const e = new Date(stage.dateEnd + 'T23:59:59')
    if (now >= s && now <= e) return stage
  }
  return null
}

export function stageDurationDays(stage: Stage) {
  const s = new Date(stage.dateStart)
  const e = new Date(stage.dateEnd)
  return Math.round((e.getTime() - s.getTime()) / DAY)
}
