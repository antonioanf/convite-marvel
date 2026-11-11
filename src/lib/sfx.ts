/**
 * Efeitos sonoros curtíssimos gerados por código (Web Audio, sem arquivos).
 * Só tocam se o convite tem música (`musica` não é null) E ela não está no mudo.
 */
import { convite } from '../config/convite'
import { audioContext, music } from './audio'

function ready() {
  if (!convite.musica || !music.isPlaying()) return null
  const ctx = audioContext()
  if (!ctx || ctx.state === 'closed') return null
  // logo no toque de abertura o contexto ainda está "suspended": o som toca assim que ele retomar
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  return ctx
}

/** Uma nota com ataque rápido e decaimento exponencial. */
function tone(ctx: AudioContext, freq: number, start: number, dur: number, vol: number, type: OscillatorType = 'sine', glideTo?: number) {
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, start)
  if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, start + dur * 0.6)
  g.gain.setValueAtTime(0.0001, start)
  g.gain.exponentialRampToValueAtTime(vol, start + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  o.connect(g).connect(ctx.destination)
  o.start(start)
  o.stop(start + dur + 0.05)
}

export const sfx = {
  /** Estalo de brilho (abrir o convite, revelar a data). */
  sparkle() {
    const ctx = ready()
    if (!ctx) return
    const t = ctx.currentTime
    ;[2093, 2637, 3136, 4186].forEach((f, i) => tone(ctx, f, t + i * 0.045, 0.22, 0.05))
  },
  /** Sininho (apagar as velinhas, 10 borboletas). */
  chime() {
    const ctx = ready()
    if (!ctx) return
    const t = ctx.currentTime
    ;[1046.5, 1318.5, 1568, 2093].forEach((f, i) => {
      tone(ctx, f, t + i * 0.11, 1.3, 0.07)
      tone(ctx, f * 2.01, t + i * 0.11, 0.6, 0.015)
    })
  },
  /** "Pop" ao pegar uma borboleta. */
  pop() {
    const ctx = ready()
    if (!ctx) return
    tone(ctx, 660, ctx.currentTime, 0.14, 0.08, 'sine', 1320)
  },
}
