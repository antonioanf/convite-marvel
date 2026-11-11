/**
 * Efeitos sonoros curtos gerados por código (Web Audio, sem arquivos).
 * Respeitam o mudo e o `musica: false` do config (lib/audio.ts).
 */
import { audioContext, audioOut } from './audio'

let noiseBuf: AudioBuffer | null = null
function noise(ctx: AudioContext) {
  if (noiseBuf && noiseBuf.sampleRate === ctx.sampleRate) return noiseBuf
  const len = ctx.sampleRate * 1.5
  noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate)
  const d = noiseBuf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  return noiseBuf
}

function out(ctx: AudioContext) {
  return audioOut() ?? ctx.destination
}

/** Uma nota com ataque rápido e decaimento exponencial. */
function tone(ctx: AudioContext, freq: number, start: number, dur: number, vol: number, type: OscillatorType = 'sine', glideTo?: number) {
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, start)
  if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, start + dur * 0.8)
  g.gain.setValueAtTime(0.0001, start)
  g.gain.exponentialRampToValueAtTime(vol, start + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  o.connect(g).connect(out(ctx))
  o.start(start)
  o.stop(start + dur + 0.05)
  return o
}

/** Ruído filtrado (estalos, explosões, fogo). */
function hiss(
  ctx: AudioContext,
  start: number,
  dur: number,
  vol: number,
  filter: BiquadFilterType,
  f0: number,
  f1 = f0,
  attack = 0.005,
) {
  const s = ctx.createBufferSource()
  s.buffer = noise(ctx)
  const f = ctx.createBiquadFilter()
  f.type = filter
  f.frequency.setValueAtTime(f0, start)
  f.frequency.exponentialRampToValueAtTime(f1, start + dur)
  f.Q.value = filter === 'bandpass' ? 1.2 : 0.7
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, start)
  g.gain.exponentialRampToValueAtTime(vol, start + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  s.connect(f).connect(g).connect(out(ctx))
  s.start(start, Math.random() * 0.4)
  s.stop(start + dur + 0.05)
}

export const sfx = {
  /** Bipe de HUD (discreto). */
  beep(alto = false) {
    const ctx = audioContext()
    if (!ctx) return
    tone(ctx, alto ? 1760 : 1320, ctx.currentTime, 0.07, 0.05, 'square')
  },
  /** Brilho (revelar, abrir). */
  sparkle() {
    const ctx = audioContext()
    if (!ctx) return
    const t = ctx.currentTime
    ;[1568, 2093, 2637, 3136].forEach((f, i) => tone(ctx, f, t + i * 0.045, 0.2, 0.05))
  },
  /** POW! da capa rasgando: papel + pancada. */
  pow() {
    const ctx = audioContext()
    if (!ctx) return
    const t = ctx.currentTime
    hiss(ctx, t, 0.28, 0.5, 'highpass', 1800, 900)
    tone(ctx, 180, t, 0.3, 0.5, 'sine', 50)
  },
  /** ZAP! (toque numa área vazia). */
  zap() {
    const ctx = audioContext()
    if (!ctx) return
    tone(ctx, 1400, ctx.currentTime, 0.14, 0.05, 'square', 300)
  },
  /** BAM! (robô derrotado). */
  bam() {
    const ctx = audioContext()
    if (!ctx) return
    const t = ctx.currentTime
    hiss(ctx, t, 0.22, 0.32, 'lowpass', 2400, 400)
    tone(ctx, 220, t, 0.18, 0.25, 'square', 70)
  },
  /** Energia carregando (segurar o botão de poder). Devolve uma função para parar. */
  charge(seconds: number) {
    const ctx = audioContext()
    if (!ctx) return () => {}
    const t = ctx.currentTime
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sawtooth'
    o.frequency.setValueAtTime(160, t)
    o.frequency.exponentialRampToValueAtTime(880, t + seconds)
    const lfo = ctx.createOscillator()
    const lg = ctx.createGain()
    lfo.frequency.value = 14
    lg.gain.value = 18
    lfo.connect(lg).connect(o.frequency)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.045, t + 0.08)
    o.connect(g).connect(out(ctx))
    o.start(t)
    lfo.start(t)
    let stopped = false
    return () => {
      if (stopped) return
      stopped = true
      const n = ctx.currentTime
      g.gain.cancelScheduledValues(n)
      g.gain.setTargetAtTime(0.0001, n, 0.03)
      o.stop(n + 0.15)
      lfo.stop(n + 0.15)
    }
  },
  /** Estalo de raio + trovão rolando. */
  thunder() {
    const ctx = audioContext()
    if (!ctx) return
    const t = ctx.currentTime
    hiss(ctx, t, 0.16, 0.7, 'highpass', 3000, 1500)
    hiss(ctx, t + 0.05, 1.6, 0.6, 'lowpass', 900, 120, 0.06)
    tone(ctx, 70, t + 0.05, 1.2, 0.35, 'sine', 38)
  },
  /** Soco no chão: pancada grave + poeira. */
  boom() {
    const ctx = audioContext()
    if (!ctx) return
    const t = ctx.currentTime
    tone(ctx, 140, t, 0.7, 0.8, 'sine', 32)
    tone(ctx, 90, t, 0.35, 0.3, 'square', 40)
    hiss(ctx, t, 0.9, 0.45, 'lowpass', 1600, 150)
  },
  /** Jato de fogo: chiado que sobe. */
  fire() {
    const ctx = audioContext()
    if (!ctx) return
    const t = ctx.currentTime
    hiss(ctx, t, 1.6, 0.42, 'bandpass', 300, 2600, 0.25)
    hiss(ctx, t, 1.4, 0.22, 'lowpass', 500, 900, 0.2)
  },
  /** Portal: arpejo cintilante subindo. */
  portal() {
    const ctx = audioContext()
    if (!ctx) return
    const t = ctx.currentTime
    tone(ctx, 220, t, 1.3, 0.12, 'sine', 880)
    ;[880, 1108.7, 1318.5, 1760, 2217.5, 2637].forEach((f, i) => tone(ctx, f, t + 0.15 + i * 0.08, 0.5, 0.045, 'triangle'))
  },
  /** Carimbo "APROVADO!". */
  stamp() {
    const ctx = audioContext()
    if (!ctx) return
    const t = ctx.currentTime
    tone(ctx, 160, t, 0.18, 0.5, 'sine', 60)
    hiss(ctx, t, 0.1, 0.25, 'lowpass', 1200, 300)
  },
  /** Vitória (10 robôs, combo, missão aceita). */
  chime() {
    const ctx = audioContext()
    if (!ctx) return
    const t = ctx.currentTime
    ;[523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      tone(ctx, f, t + i * 0.1, 0.9, 0.08, 'square')
      tone(ctx, f * 2, t + i * 0.1, 0.5, 0.02)
    })
  },
  /** "Pop" curtinho. */
  pop() {
    const ctx = audioContext()
    if (!ctx) return
    tone(ctx, 660, ctx.currentTime, 0.12, 0.08, 'sine', 1320)
  },
}
