/** Datas da festa já formatadas (pt-BR, no fuso do config). */
import { convite } from '../config/convite'
import { eventTimes } from './calendar'

const f = convite.festa
const tz = f.fusoHorario
const start = new Date(f.dataHora)
const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('pt-BR', { timeZone: tz, ...o }).format(start)
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** "16 · 05 · 2027" */
export const dataCurta = fmt({ day: '2-digit', month: '2-digit', year: 'numeric' }).split('/').join(' · ')
/** "Domingo" */
export const diaSemana = cap(fmt({ weekday: 'long' }))
/** "16 de maio" */
export const diaMes = fmt({ day: 'numeric', month: 'long' })
export const ano = fmt({ year: 'numeric' })
/** "16:00" — ou null enquanto o horário não está definido */
export const hora = f.horarioDefinido ? fmt({ hour: '2-digit', minute: '2-digit' }) : null

type Phase = 'antes' | 'hoje' | 'depois'
const dayKey = (d: Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)

export function partyPhase(nowMs: number): Phase {
  const { end } = eventTimes(convite)
  if (nowMs >= end.getTime()) return 'depois'
  if (dayKey(new Date(nowMs)) === dayKey(start)) return 'hoje'
  return nowMs < start.getTime() ? 'antes' : 'hoje'
}

/** Dias inteiros que faltam (mesmo cálculo da contagem regressiva). */
export function diasAte(nowMs: number) {
  return Math.max(0, Math.floor((start.getTime() - nowMs) / 86_400_000))
}
