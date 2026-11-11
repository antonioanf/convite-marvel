/**
 * Som do convite (tudo gerado por código com Web Audio, sem arquivos):
 *  - uma musiquinha heroica curta (~14 s), em volume baixo, que toca 2 vezes e para sozinha;
 *  - os efeitos sonoros (lib/sfx.ts) usam o mesmo contexto.
 * O botão de mudo (sempre visível) desliga tudo; ao religar, a música toca mais uma vez.
 * O contexto só pode ser criado num toque (regra dos navegadores): o toque de abertura.
 */
import { convite } from '../config/convite'

type Listener = () => void
type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext }

let ctx: AudioContext | null = null
let master: GainNode | null = null
let musicBus: GainNode | null = null
let muted = false
let musicPlaying = false
const listeners = new Set<Listener>()
const emit = () => listeners.forEach((l) => l())

/* ---------------- a música ---------------- */
// notas em semitons a partir do Lá 440 (A4 = 0)
const N: Record<string, number> = {
  F2: -28, G2: -26, C3: -21, E3: -17, F3: -16, G3: -14,
  G4: -2, A4: 0, B4: 2, C5: 3, D5: 5, E5: 7, F5: 8, G5: 10, A5: 12,
}
const hz = (n: string) => 440 * Math.pow(2, N[n] / 12)
// [nota, duração em colcheias] — fanfarra em Dó maior, 8 compassos
const MELODIA: [string | null, number][] = [
  ['C5', 2], ['C5', 1], ['G4', 1], ['C5', 2], ['E5', 2],
  ['G5', 3], ['E5', 1], ['C5', 2], ['E5', 2],
  ['F5', 2], ['E5', 1], ['D5', 1], ['C5', 2], ['A4', 2],
  ['G4', 2], ['B4', 2], ['D5', 2], ['G5', 2],
  ['C5', 2], ['C5', 1], ['G4', 1], ['C5', 2], ['E5', 2],
  ['G5', 3], ['A5', 1], ['G5', 2], ['E5', 2],
  ['F5', 2], ['D5', 1], ['B4', 1], ['G4', 2], ['B4', 2],
  ['C5', 6], [null, 2],
]
const BAIXO = ['C3', 'C3', 'C3', 'E3', 'F2', 'F3', 'G2', 'G3', 'C3', 'C3', 'E3', 'C3', 'G2', 'G3', 'C3', 'C3']
const COLCHEIA = 60 / 138 / 2 // 138 bpm
const VEZES = 2
const VOL = 0.5 // volume geral baixo (a melodia em si já é suave)

let sched: { events: { t: number; f: number; d: number; v: number; type: OscillatorType }[]; i: number; timer: number; end: number } | null = null

function buildEvents(t0: number) {
  const events: { t: number; f: number; d: number; v: number; type: OscillatorType }[] = []
  const loop = MELODIA.reduce((s, [, d]) => s + d, 0) * COLCHEIA
  for (let k = 0; k < VEZES; k++) {
    let t = t0 + k * loop
    for (const [n, d] of MELODIA) {
      if (n) events.push({ t, f: hz(n), d: d * COLCHEIA * 0.92, v: 0.05, type: 'square' })
      t += d * COLCHEIA
    }
    BAIXO.forEach((n, i) => events.push({ t: t0 + k * loop + i * 4 * COLCHEIA, f: hz(n), d: 4 * COLCHEIA * 0.9, v: 0.11, type: 'triangle' }))
  }
  events.sort((a, b) => a.t - b.t)
  return { events, end: t0 + VEZES * loop }
}

function note(e: { t: number; f: number; d: number; v: number; type: OscillatorType }) {
  if (!ctx || !musicBus) return
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = e.type
  o.frequency.value = e.f
  g.gain.setValueAtTime(0.0001, e.t)
  g.gain.exponentialRampToValueAtTime(e.v, e.t + 0.015)
  g.gain.setValueAtTime(e.v * 0.7, e.t + Math.min(0.1, e.d * 0.5))
  g.gain.exponentialRampToValueAtTime(0.0001, e.t + e.d)
  o.connect(g).connect(musicBus)
  o.start(e.t)
  o.stop(e.t + e.d + 0.05)
}

/** Agenda as notas aos poucos (lookahead de 0,6 s), para não criar centenas de nós de uma vez. */
function tick() {
  if (!sched || !ctx) return
  const horizon = ctx.currentTime + 0.6
  while (sched.i < sched.events.length && sched.events[sched.i].t < horizon) note(sched.events[sched.i++])
  if (ctx.currentTime > sched.end) stopMusic()
}

function startMusic() {
  if (!ctx || !master || muted) return
  stopMusic()
  musicBus = ctx.createGain()
  musicBus.gain.value = 1
  musicBus.connect(master)
  const { events, end } = buildEvents(ctx.currentTime + 0.15)
  sched = { events, i: 0, end, timer: window.setInterval(tick, 200) }
  tick()
  musicPlaying = true
  emit()
}

function stopMusic() {
  if (sched) clearInterval(sched.timer)
  sched = null
  if (musicBus && ctx) {
    const bus = musicBus
    bus.gain.setTargetAtTime(0, ctx.currentTime, 0.08)
    setTimeout(() => bus.disconnect(), 500)
  }
  musicBus = null
  if (musicPlaying) {
    musicPlaying = false
    emit()
  }
}

/** Contexto de áudio pronto para os efeitos (null se mudo, sem som no config ou antes do toque). */
export function audioContext() {
  if (!convite.musica || muted || !ctx || ctx.state === 'closed') return null
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  return ctx
}
/** Saída geral (respeita o mudo). */
export const audioOut = () => master

export const som = {
  available: convite.musica,
  isMuted: () => muted,
  isMusicPlaying: () => musicPlaying,
  subscribe(l: Listener) {
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  },
  /** Chamar dentro do toque de abertura: cria o contexto e começa a música. */
  start() {
    if (!convite.musica || ctx) return
    try {
      const AC = window.AudioContext || (window as WebkitWindow).webkitAudioContext
      if (!AC) return
      ctx = new AC()
      master = ctx.createGain()
      master.gain.value = VOL
      master.connect(ctx.destination)
      ctx.resume().catch(() => {})
      startMusic()
    } catch {
      ctx = null
    }
  },
  toggleMute() {
    if (!ctx) {
      // ainda sem contexto (ex.: ?abrir=1): o toque no botão cria e liga
      muted = false
      som.start()
      emit()
      return
    }
    muted = !muted
    if (master) master.gain.setTargetAtTime(muted ? 0 : VOL, ctx.currentTime, 0.05)
    if (muted) stopMusic()
    else startMusic()
    emit()
  },
}

if (typeof document !== 'undefined') {
  // app em segundo plano: suspende o contexto (a música para no ponto e continua ao voltar)
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return
    if (document.hidden) ctx.suspend().catch(() => {})
    else if (!muted) ctx.resume().catch(() => {})
  })
}
