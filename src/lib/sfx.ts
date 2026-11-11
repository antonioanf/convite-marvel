/**
 * Efeitos sonoros realistas gerados por código (Web Audio, sem arquivos).
 * Trovão com eco, estalo elétrico, impacto grave, rugido de energia, disparo, zumbido, portal...
 * Respeitam o mudo e o `musica: false` do config (lib/audio.ts).
 */
import { audioContext, audioOut, ruido, salaEco } from './audio'

const out = (c: AudioContext) => audioOut() ?? c.destination

/** Ruído filtrado com envelope (base de trovões, impactos, fogo). */
function ruidoF(
  c: AudioContext,
  t: number,
  dur: number,
  vol: number,
  tipo: BiquadFilterType,
  f0: number,
  f1 = f0,
  ataque = 0.005,
  eco = 0,
) {
  const s = c.createBufferSource()
  s.buffer = ruido(c)
  const f = c.createBiquadFilter()
  f.type = tipo
  f.frequency.setValueAtTime(f0, t)
  f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur)
  f.Q.value = tipo === 'bandpass' ? 0.9 : 0.6
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(vol, t + ataque)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  s.connect(f).connect(g).connect(out(c))
  if (eco) {
    const sala = salaEco()
    if (sala) {
      const ge = c.createGain()
      ge.gain.value = eco
      g.connect(ge).connect(sala)
    }
  }
  s.start(t, Math.random() * 1.5)
  s.stop(t + dur + 0.05)
  return g
}

/** Oscilador com envelope e glissando. */
function tom(c: AudioContext, f: number, t: number, dur: number, vol: number, tipo: OscillatorType = 'sine', f1?: number, eco = 0) {
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = tipo
  o.frequency.setValueAtTime(f, t)
  if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.85)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(out(c))
  if (eco) {
    const sala = salaEco()
    if (sala) {
      const ge = c.createGain()
      ge.gain.value = eco
      g.connect(ge).connect(sala)
    }
  }
  o.start(t)
  o.stop(t + dur + 0.05)
  return o
}

export const sfx = {
  /** Trovão: estalo seco (se perto), ronco grave rolando e eco. `perto` de 0 (longe) a 1 (em cima). */
  trovao(perto = 1) {
    const c = audioContext()
    if (!c) return
    const t = c.currentTime
    if (perto > 0.5) {
      ruidoF(c, t, 0.09, 0.9 * perto, 'highpass', 2600, 1800, 0.002, 0.3)
      ruidoF(c, t + 0.02, 0.35, 0.55 * perto, 'bandpass', 1200, 300, 0.004, 0.4)
    }
    // ronco: várias "rolagens" de ruído grave em sequência
    const atraso = perto > 0.5 ? 0.05 : 0.5
    for (let k = 0; k < 4; k++) {
      ruidoF(c, t + atraso + k * (0.35 + Math.random() * 0.3), 1.6 + Math.random(), (0.55 - k * 0.1) * (0.5 + perto * 0.5), 'lowpass', 700 - k * 120, 90, 0.08, 0.7)
    }
    tom(c, 62, t + atraso, 2.2, 0.35 * (0.4 + perto * 0.6), 'sine', 34, 0.5)
  },
  /** Estalo elétrico curto (raio pequeno, faísca). */
  estalo(vol = 0.5) {
    const c = audioContext()
    if (!c) return
    const t = c.currentTime
    ruidoF(c, t, 0.06, vol, 'highpass', 3500, 2200, 0.001)
    tom(c, 1800, t, 0.05, vol * 0.12, 'square', 400)
  },
  /** Impacto grave: pancada sub-grave, estrondo e cascalho caindo. */
  impacto(forca = 1) {
    const c = audioContext()
    if (!c) return
    const t = c.currentTime
    tom(c, 110, t, 1.1, 0.95 * forca, 'sine', 28, 0.6)
    tom(c, 70, t, 0.5, 0.4 * forca, 'triangle', 30)
    ruidoF(c, t, 1.4, 0.7 * forca, 'lowpass', 1800, 80, 0.003, 0.6)
    // cascalho: grãos curtos de ruído médio
    for (let k = 0; k < 9; k++) ruidoF(c, t + 0.15 + Math.random() * 0.9, 0.05 + Math.random() * 0.08, 0.12 * forca, 'bandpass', 900 + Math.random() * 1800, 600, 0.002)
  },
  /** Energia carregando (segurar o dedo): rugido que sobe. Devolve uma função para parar. */
  carga(segundos: number) {
    const c = audioContext()
    if (!c) return () => {}
    const t = c.currentTime
    const o = c.createOscillator()
    o.type = 'sawtooth'
    o.frequency.setValueAtTime(55, t)
    o.frequency.exponentialRampToValueAtTime(220, t + segundos)
    const lp = c.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.setValueAtTime(200, t)
    lp.frequency.exponentialRampToValueAtTime(2400, t + segundos)
    const g = c.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.18, t + 0.15)
    o.connect(lp).connect(g).connect(out(c))
    const n = c.createBufferSource()
    n.buffer = ruido(c)
    n.loop = true
    const bp = c.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.setValueAtTime(300, t)
    bp.frequency.exponentialRampToValueAtTime(3000, t + segundos)
    const ng = c.createGain()
    ng.gain.setValueAtTime(0.0001, t)
    ng.gain.exponentialRampToValueAtTime(0.25, t + segundos)
    n.connect(bp).connect(ng).connect(out(c))
    o.start(t)
    n.start(t)
    let parado = false
    return () => {
      if (parado) return
      parado = true
      const a = c.currentTime
      g.gain.cancelScheduledValues(a)
      ng.gain.cancelScheduledValues(a)
      g.gain.setTargetAtTime(0.0001, a, 0.05)
      ng.gain.setTargetAtTime(0.0001, a, 0.05)
      o.stop(a + 0.3)
      n.stop(a + 0.3)
    }
  },
  /** Disparo da rajada: rugido de energia descendo + chiado de plasma. */
  disparo() {
    const c = audioContext()
    if (!c) return
    const t = c.currentTime
    tom(c, 180, t, 0.9, 0.5, 'sawtooth', 45, 0.3)
    ruidoF(c, t, 1.2, 0.6, 'bandpass', 3200, 400, 0.01, 0.3)
    ruidoF(c, t, 0.8, 0.4, 'lowpass', 900, 120, 0.005)
  },
  /** Zumbido elétrico contínuo (eletricidade correndo). Devolve uma função para parar. */
  zumbido(vol = 0.08) {
    const c = audioContext()
    if (!c) return () => {}
    const t = c.currentTime
    const g = c.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(vol, t + 0.1)
    const lp = c.createBiquadFilter()
    lp.type = 'bandpass'
    lp.frequency.value = 900
    lp.Q.value = 0.7
    const os = [60, 120, 180.5].map((f) => {
      const o = c.createOscillator()
      o.type = 'sawtooth'
      o.frequency.value = f
      o.connect(lp)
      o.start(t)
      return o
    })
    lp.connect(g).connect(out(c))
    let parado = false
    return () => {
      if (parado) return
      parado = true
      const a = c.currentTime
      g.gain.setTargetAtTime(0.0001, a, 0.08)
      os.forEach((o) => o.stop(a + 0.5))
    }
  },
  /** Portal: sopro grave que se abre + brilho etéreo. */
  portal() {
    const c = audioContext()
    if (!c) return
    const t = c.currentTime
    ruidoF(c, t, 2.4, 0.45, 'bandpass', 150, 1200, 0.5, 0.5)
    tom(c, 55, t, 2.6, 0.35, 'sine', 82, 0.4)
    ;[659.25, 830.6, 987.8, 1318.5].forEach((f, i) => tom(c, f, t + 0.4 + i * 0.12, 2.2, 0.025, 'sine', undefined, 0.6))
  },
  /** Névoa mística: sopro que sobe e desce. */
  magia() {
    const c = audioContext()
    if (!c) return
    const t = c.currentTime
    ruidoF(c, t, 1.6, 0.28, 'bandpass', 400, 1600, 0.4, 0.4)
    tom(c, 220, t, 1.6, 0.06, 'triangle', 330, 0.5)
  },
  /** Energia cósmica: crescendo que explode numa onda. */
  cosmico() {
    const c = audioContext()
    if (!c) return
    const t = c.currentTime
    ruidoF(c, t, 1.1, 0.35, 'bandpass', 200, 4000, 0.9)
    tom(c, 82, t + 1, 1.8, 0.7, 'sine', 30, 0.6)
    ruidoF(c, t + 1, 1.6, 0.5, 'lowpass', 2400, 120, 0.004, 0.6)
    ;[1046.5, 1318.5, 1568].forEach((f, i) => tom(c, f, t + 1.05 + i * 0.05, 1.8, 0.02, 'sine', undefined, 0.7))
  },
  /** Fogo/plasma contínuo curto (sopro). */
  sopro(dur = 1.4) {
    const c = audioContext()
    if (!c) return
    const t = c.currentTime
    ruidoF(c, t, dur, 0.4, 'bandpass', 250, 1800, 0.15)
    ruidoF(c, t, dur, 0.25, 'lowpass', 400, 200, 0.2)
  },
  /** Confirmação séria (credencial aprovada): pancada grave + acorde que sobe. */
  aprovado() {
    const c = audioContext()
    if (!c) return
    const t = c.currentTime
    tom(c, 98, t, 1.2, 0.5, 'sine', 49, 0.4)
    ;[196, 293.7, 392].forEach((f, i) => tom(c, f, t + 0.05 + i * 0.04, 1.6, 0.05, 'sawtooth', undefined, 0.3))
  },
}
