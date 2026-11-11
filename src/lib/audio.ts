/**
 * Som do convite (tudo gerado por código com Web Audio, sem arquivos):
 *  - uma trilha de cinema curta (~16 s): acordes graves e escuros, tímpanos distantes e cordas
 *    altas que entram no fim; volume baixo, toca 2 vezes e para sozinha;
 *  - os efeitos (lib/sfx.ts) usam o mesmo contexto e uma sala com eco compartilhada.
 * O botão de mudo (sempre visível) desliga tudo; ao religar, a trilha toca mais uma vez.
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

/* ---------------- a trilha ---------------- */
type Ev = { t: number; f: number; d: number; v: number; kind: 'pad' | 'timpano' | 'corda' }
// Lá menor · Fá · Ré menor · Mi (cadência dramática), notas graves em Hz
const ACORDES = [
  [55, 82.41, 110, 130.81],
  [43.65, 87.31, 110, 130.81],
  [36.71, 73.42, 87.31, 110],
  [41.2, 82.41, 103.83, 123.47],
]
const CORDAS = [440, 523.25, 587.33, 659.25]
const COMPASSO = 4
const VEZES = 2
const VOL = 0.45

let sched: { events: Ev[]; i: number; timer: number; end: number } | null = null

function buildEvents(t0: number) {
  const events: Ev[] = []
  const loop = ACORDES.length * COMPASSO
  for (let k = 0; k < VEZES; k++) {
    ACORDES.forEach((ac, i) => {
      const t = t0 + k * loop + i * COMPASSO
      ac.forEach((f, j) => events.push({ t, f, d: COMPASSO + 1.4, v: j === 0 ? 0.1 : 0.045, kind: 'pad' }))
      events.push({ t, f: ac[0], d: 1.6, v: 0.32, kind: 'timpano' })
      events.push({ t: t + 3, f: ac[0], d: 0.9, v: 0.16, kind: 'timpano' })
      if (i >= 2) events.push({ t: t + 0.3, f: CORDAS[i], d: COMPASSO + 0.6, v: 0.018, kind: 'corda' })
    })
  }
  events.sort((a, b) => a.t - b.t)
  return { events, end: t0 + VEZES * loop + 2 }
}

let ruidoBuf: AudioBuffer | null = null
export function ruido(c: AudioContext) {
  if (ruidoBuf && ruidoBuf.sampleRate === c.sampleRate) return ruidoBuf
  const len = c.sampleRate * 3
  ruidoBuf = c.createBuffer(1, len, c.sampleRate)
  const d = ruidoBuf.getChannelData(0)
  // ruído "marrom" suavizado misturado com branco (mais natural que o branco puro)
  let ult = 0
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1
    ult = (ult + 0.02 * w) / 1.02
    d[i] = w * 0.35 + ult * 3.2
  }
  return ruidoBuf
}

function note(e: Ev) {
  if (!ctx || !musicBus) return
  const g = ctx.createGain()
  g.connect(musicBus)
  if (e.kind === 'pad') {
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.setValueAtTime(220, e.t)
    lp.frequency.linearRampToValueAtTime(480, e.t + e.d * 0.5)
    lp.frequency.linearRampToValueAtTime(220, e.t + e.d)
    lp.connect(g)
    for (const det of [1, 1.007, 0.995]) {
      const o = ctx.createOscillator()
      o.type = 'sawtooth'
      o.frequency.value = e.f * det
      o.connect(lp)
      o.start(e.t)
      o.stop(e.t + e.d + 0.1)
    }
    g.gain.setValueAtTime(0.0001, e.t)
    g.gain.linearRampToValueAtTime(e.v, e.t + 1.4)
    g.gain.setValueAtTime(e.v, e.t + e.d - 1.6)
    g.gain.linearRampToValueAtTime(0.0001, e.t + e.d)
  } else if (e.kind === 'timpano') {
    // tímpano distante: seno grave com queda de altura + ruído abafado
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.setValueAtTime(e.f * 1.6, e.t)
    o.frequency.exponentialRampToValueAtTime(e.f, e.t + 0.12)
    o.connect(g)
    o.start(e.t)
    o.stop(e.t + e.d)
    const n = ctx.createBufferSource()
    n.buffer = ruido(ctx)
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 260
    const ng = ctx.createGain()
    ng.gain.setValueAtTime(e.v * 0.6, e.t)
    ng.gain.exponentialRampToValueAtTime(0.0001, e.t + 0.5)
    n.connect(lp).connect(ng).connect(musicBus)
    n.start(e.t, Math.random())
    n.stop(e.t + 0.6)
    g.gain.setValueAtTime(0.0001, e.t)
    g.gain.exponentialRampToValueAtTime(e.v, e.t + 0.008)
    g.gain.exponentialRampToValueAtTime(0.0001, e.t + e.d)
  } else {
    // cordas altas: triângulo com vibrato e ataque lento
    const o = ctx.createOscillator()
    o.type = 'triangle'
    o.frequency.value = e.f
    const lfo = ctx.createOscillator()
    const lg = ctx.createGain()
    lfo.frequency.value = 5.2
    lg.gain.value = e.f * 0.006
    lfo.connect(lg).connect(o.frequency)
    o.connect(g)
    o.start(e.t)
    lfo.start(e.t)
    o.stop(e.t + e.d + 0.1)
    lfo.stop(e.t + e.d + 0.1)
    g.gain.setValueAtTime(0.0001, e.t)
    g.gain.linearRampToValueAtTime(e.v, e.t + 1.8)
    g.gain.linearRampToValueAtTime(0.0001, e.t + e.d)
  }
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
  // a trilha entra depois do trovão da abertura
  const { events, end } = buildEvents(ctx.currentTime + 1.2)
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
    bus.gain.setTargetAtTime(0, ctx.currentTime, 0.15)
    setTimeout(() => bus.disconnect(), 900)
  }
  musicBus = null
  if (musicPlaying) {
    musicPlaying = false
    emit()
  }
}

/* ---------------- sala com eco (trovões, impactos) ---------------- */
let eco: AudioNode | null = null
/** Entrada de um eco longo (atraso com realimentação + filtro), ligado à saída geral. */
export function salaEco() {
  if (eco || !ctx || !master) return eco
  const entrada = ctx.createGain()
  const atraso = ctx.createDelay(2)
  atraso.delayTime.value = 0.33
  const volta = ctx.createGain()
  volta.gain.value = 0.42
  const filtro = ctx.createBiquadFilter()
  filtro.type = 'lowpass'
  filtro.frequency.value = 1400
  entrada.connect(atraso)
  atraso.connect(filtro).connect(volta).connect(atraso)
  const saida = ctx.createGain()
  saida.gain.value = 0.55
  filtro.connect(saida).connect(master)
  eco = entrada
  return eco
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
  /** Chamar dentro do toque de abertura: cria o contexto e começa a trilha. */
  start() {
    if (!convite.musica || ctx) return
    try {
      const AC = window.AudioContext || (window as WebkitWindow).webkitAudioContext
      if (!AC) return
      ctx = new AC()
      master = ctx.createGain()
      master.gain.value = VOL
      // um compressor leve evita estourar quando trovão e trilha somam
      const comp = ctx.createDynamicsCompressor()
      comp.threshold.value = -14
      comp.ratio.value = 4
      master.connect(comp).connect(ctx.destination)
      ctx.resume().catch(() => {})
      startMusic()
    } catch {
      ctx = null
    }
  },
  toggleMute() {
    if (!ctx) {
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
  // app em segundo plano: suspende o contexto (a trilha para no ponto e continua ao voltar)
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return
    if (document.hidden) ctx.suspend().catch(() => {})
    else if (!muted) ctx.resume().catch(() => {})
  })
}
