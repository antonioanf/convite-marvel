// Funções puras (sem DOM) — também usadas pelo vite.config.ts para gerar /convite.ics.
import type { ConviteConfig } from '../config/convite.ts'

function toUtcStamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

/** Data local da festa (no fuso do config) como "AAAAMMDD", mais o dia seguinte. */
function localDays(c: ConviteConfig) {
  const fmt = (d: Date) =>
    new Intl.DateTimeFormat('en-CA', { timeZone: c.festa.fusoHorario, year: 'numeric', month: '2-digit', day: '2-digit' })
      .format(d)
      .replace(/-/g, '')
  const start = new Date(c.festa.dataHora)
  const day = fmt(start)
  const next = new Date(Date.UTC(+day.slice(0, 4), +day.slice(4, 6) - 1, +day.slice(6, 8) + 1))
  return { day, next: next.toISOString().slice(0, 10).replace(/-/g, '') }
}

export function eventTimes(c: ConviteConfig) {
  const start = new Date(c.festa.dataHora)
  if (!c.festa.horarioDefinido) {
    // horário a definir: a festa "acaba" no fim do dia (no fuso da festa)
    const { next } = localDays(c)
    const offset = c.festa.dataHora.match(/([+-]\d\d:\d\d|Z)$/)?.[1] ?? 'Z'
    const end = new Date(`${next.slice(0, 4)}-${next.slice(4, 6)}-${next.slice(6, 8)}T00:00:00${offset}`)
    return { start, end }
  }
  const end = new Date(start.getTime() + c.festa.duracaoHoras * 3600_000)
  return { start, end }
}

export function eventTitle(c: ConviteConfig) {
  return `Aniversário de ${c.crianca.nome} 🦋 ${c.crianca.idade} anos`
}

const where = (c: ConviteConfig) => [c.festa.local, c.festa.endereco].filter(Boolean).join(', ')
const about = (c: ConviteConfig) =>
  [c.crianca.frase, !c.festa.horarioDefinido && 'Horário a confirmar.', c.site.url && `Convite: ${c.site.url}`].filter(Boolean).join('\n\n')

export function googleCalendarUrl(c: ConviteConfig): string {
  const { start, end } = eventTimes(c)
  const { day, next } = localDays(c)
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: eventTitle(c),
    // sem horário definido: evento de dia inteiro
    dates: c.festa.horarioDefinido ? `${toUtcStamp(start)}/${toUtcStamp(end)}` : `${day}/${next}`,
    details: about(c),
    location: where(c),
  })
  if (c.festa.horarioDefinido) p.set('ctz', c.festa.fusoHorario)
  return `https://calendar.google.com/calendar/render?${p.toString()}`
}

function icsEscape(s: string) {
  return s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
}

export function buildIcs(c: ConviteConfig): string {
  const { start, end } = eventTimes(c)
  const { day, next } = localDays(c)
  const when = c.festa.horarioDefinido
    ? [`DTSTART:${toUtcStamp(start)}`, `DTEND:${toUtcStamp(end)}`]
    : [`DTSTART;VALUE=DATE:${day}`, `DTEND;VALUE=DATE:${next}`]
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Convite Borboleta//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${day}-${c.crianca.nome.toLowerCase().replace(/\W/g, '')}@convite`,
    `DTSTAMP:${toUtcStamp(new Date())}`,
    ...when,
    `SUMMARY:${icsEscape(eventTitle(c))}`,
    `DESCRIPTION:${icsEscape(about(c))}`,
    ...(where(c) ? [`LOCATION:${icsEscape(where(c))}`] : []),
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:${icsEscape(`Amanhã é a festa de ${c.crianca.nome}!`)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.join('\r\n') + '\r\n'
}
