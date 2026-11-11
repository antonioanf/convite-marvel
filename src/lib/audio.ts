/**
 * Música de fundo. Só começa depois do toque de abertura (regra dos navegadores).
 * Usa Web Audio (GainNode) para o fade-in funcionar também no iOS,
 * onde `audio.volume` é somente leitura.
 */
import { convite } from '../config/convite'

type Listener = () => void
type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext }

const TARGET = 0.55
let el: HTMLAudioElement | null = null
let ctx: AudioContext | null = null
let gain: GainNode | null = null
let playing = false
let available = !!convite.musica
let resumeOnVisible = false
const listeners = new Set<Listener>()
const emit = () => listeners.forEach((l) => l())

function fadeTo(value: number, seconds: number) {
  if (gain && ctx) {
    const t = ctx.currentTime
    gain.gain.cancelScheduledValues(t)
    gain.gain.setValueAtTime(gain.gain.value, t)
    gain.gain.linearRampToValueAtTime(value, t + seconds)
  } else if (el) {
    // fallback sem Web Audio
    const a = el
    const from = a.volume
    const t0 = performance.now()
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / (seconds * 1000))
      try {
        a.volume = from + (value - from) * k
      } catch {
        /* iOS ignora */
      }
      if (k < 1) requestAnimationFrame(step)
    }
    step()
  }
}

function play(fadeSeconds: number) {
  if (!el) return
  ctx?.resume().catch(() => {})
  const p = el.play()
  playing = true
  emit()
  fadeTo(TARGET, fadeSeconds)
  if (p && typeof p.catch === 'function') {
    p.catch(() => {
      playing = false
      emit()
    })
  }
}

function pause() {
  if (!el) return
  playing = false
  emit()
  fadeTo(0, 0.35)
  const a = el
  setTimeout(() => !playing && a.pause(), 380)
}

/** Contexto de áudio (criado no toque de abertura) — usado também pelos efeitos sonoros. */
export const audioContext = () => ctx

export const music = {
  isAvailable: () => available,
  isPlaying: () => playing,
  subscribe(l: Listener) {
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  },
  /** Chamar dentro do toque de abertura. */
  start() {
    if (!convite.musica || el) return
    try {
      el = new Audio(convite.musica)
      el.loop = true
      el.preload = 'auto'
      el.setAttribute('playsinline', '')
      el.addEventListener('error', () => {
        available = false
        playing = false
        emit()
      })
      const AC = window.AudioContext || (window as WebkitWindow).webkitAudioContext
      if (AC) {
        ctx = new AC()
        gain = ctx.createGain()
        gain.gain.value = 0
        ctx.createMediaElementSource(el).connect(gain)
        gain.connect(ctx.destination)
      } else {
        el.volume = 0
      }
      play(2.5)
    } catch {
      available = false
      emit()
    }
  },
  toggle() {
    if (!el) return music.start()
    if (playing) pause()
    else play(0.8)
  },
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      resumeOnVisible = playing
      if (playing) pause()
    } else if (resumeOnVisible) {
      resumeOnVisible = false
      play(1)
    }
  })
}
