/**
 * Simulação dos poderes (sem desenho): raios, ondas de choque, rachaduras, partículas com física,
 * feixe, névoa, portal e energia cósmica. A cada quadro monta um `Quadro` que o renderizador WebGL
 * (motor.ts) ou o fallback 2D (render2d.ts) desenha. Coordenadas em px CSS, tempo em segundos.
 */
import { envelope, gerarRaio, type Pt, type Raio } from '../lib/fx/raio'
import type { Linha, Particula } from './gl/render'

export type RGB = [number, number, number]

const R = Math.random
const entre = (a: number, b: number) => a + R() * (b - a)
const escolha = <T,>(xs: T[]) => xs[(R() * xs.length) | 0]
/** taxa fracionária → quantidade inteira neste quadro (1,3 = 1 ou 2, na média 1,3) */
const quantos = (taxa: number) => Math.floor(taxa) + (R() < taxa % 1 ? 1 : 0)
const ss = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/* cores de luz (0..1) */
export const COR = {
  azul: [0.12, 0.5, 1] as RGB,
  azulClaro: [0.55, 0.78, 1] as RGB,
  branco: [1, 0.98, 0.95] as RGB,
  fogo: [1, 0.42, 0.05] as RGB,
  laranja: [1, 0.6, 0.18] as RGB,
  vermelho: [0.95, 0.16, 0.08] as RGB,
  ceu: [0.45, 0.75, 1] as RGB,
  violeta: [0.6, 0.36, 1] as RGB,
  turquesa: [0.08, 0.8, 0.78] as RGB,
  ouro: [1, 0.78, 0.3] as RGB,
  ciano: [0.13, 0.83, 0.93] as RGB,
}

/** Temperatura de cor do fogo/brasa: 1 = amarelo-branco, 0.5 = laranja, 0 = vermelho escuro. */
export function temperatura(k: number): RGB {
  if (k > 0.7) {
    const t = (k - 0.7) / 0.3
    return [1, 0.55 + 0.35 * t, 0.15 + 0.55 * t]
  }
  if (k > 0.35) {
    const t = (k - 0.35) / 0.35
    return [0.85 + 0.15 * t, 0.2 + 0.35 * t, 0.04 + 0.11 * t]
  }
  const t = k / 0.35
  return [0.35 + 0.5 * t, 0.04 + 0.16 * t, 0.02 + 0.02 * t]
}

interface RaioVivo {
  r: Raio
  t0: number
  lw: number
  halo: RGB
  nuc: RGB
}
interface Fio {
  pts: Pt[]
  t0: number
  vida: number
  larg: number
  halo: RGB
}
interface Racha {
  pts: Pt[]
  t0: number
  larg: number
}
interface Onda {
  x: number
  y: number
  t0: number
  vel: number
  forca: number
  dur: number
  cor: RGB
}
interface Orbe {
  x: number
  y: number
  vx: number
  vy: number
  cor: RGB
  tam: number
  rastro: Pt[]
  vivo: boolean
}

export interface Quadro {
  t: number
  shake: [number, number]
  linhas: Linha[]
  escuras: Linha[]
  luz: Particula[]
  sobre: Particula[]
  tempestade: { alfa: number; luz: number; luzPos: Pt; marca: [number, number, number, number] } | null
  ondas: { x: number; y: number; r: number; forca: number; cor: RGB }[]
  poco: [number, number, number, number] | null
  feixe: { a: Pt; b: Pt; larg: number; forca: number; alcance: number; carga: number } | null
  nevoa: { pts: [number, number, number][]; alfa: number } | null
  portal: { c: Pt; r: number; abre: number } | null
  lente: [number, number, number, number]
  calor: [number, number, number, number, number, number]
  ativo: boolean
}

export class Sim {
  W = 1
  H = 1
  t = 0
  maxPart: number
  ps: Particula[] = []
  raios: RaioVivo[] = []
  fios: Fio[] = []
  rachas: Racha[] = []
  ondas: Onda[] = []
  tempestade: { t0: number; dur: number; luzPos: Pt; luz: number; marca: { x: number; y: number; t0: number } | null } | null = null
  poco: { x: number; y: number; t0: number; r: number } | null = null
  feixe: { a: Pt; b: Pt; t0: number; carga: number; fase: 'carga' | 'disparo'; tc: number; larg: number; ultArco: number } | null = null
  calor: { a: Pt; b: Pt; t0: number; larg: number } | null = null
  nevoa: { pts: { x: number; y: number; t0: number }[]; ativa: boolean; ultimo: number } | null = null
  portal: { c: Pt; r: number; t0: number; dur: number } | null = null
  cosmico: { c: Pt; t0: number; fase: 'reunir' | 'explodir'; te: number; orbes: Orbe[]; nucleo: number } | null = null
  amp = 0
  private agenda: { t: number; fn: () => void }[] = []
  /** retângulos dos cartões visíveis (para a eletricidade correr pelas bordas) */
  bordas: DOMRect[] = []

  constructor(maxPart: number) {
    this.maxPart = maxPart
  }

  depois(s: number, fn: () => void) {
    this.agenda.push({ t: this.t + s, fn })
  }

  /** Adiciona partícula respeitando o limite (as mais antigas saem primeiro). */
  add(p: Partial<Particula> & { x: number; y: number }) {
    if (this.ps.length >= this.maxPart) this.ps.splice(0, this.ps.length - this.maxPart + 1)
    this.ps.push({
      vx: 0,
      vy: 0,
      g: 0,
      atrito: 0,
      vida: 0,
      max: 1,
      tam0: 6,
      tam1: 6,
      cor: COR.branco,
      a0: 1,
      a1: 0,
      tipo: 0,
      seed: R(),
      aditiva: true,
      ...p,
    })
  }

  sacudir(a: number) {
    this.amp = Math.max(this.amp, a)
  }

  raio(a: Pt, b: Pt, lw: number, halo: RGB = COR.azul, nuc: RGB = [0.9, 0.96, 1], galhos = 1.3, atraso = 0) {
    const r = gerarRaio(a, b, { niveis: 8, galhos })
    this.raios.push({ r, t0: this.t + atraso, lw, halo, nuc })
    return r
  }

  onda(x: number, y: number, o: { vel?: number; forca?: number; dur?: number; cor?: RGB; atraso?: number } = {}) {
    this.ondas.push({ x, y, t0: this.t + (o.atraso ?? 0), vel: o.vel ?? 900, forca: o.forca ?? 1, dur: o.dur ?? 0.9, cor: o.cor ?? COR.laranja })
    if (this.ondas.length > 4) this.ondas.shift()
  }

  /* ---------------- poderes ---------------- */

  iniciarTempestade(alvo: Pt) {
    const t = this.t
    const ox = alvo.x + entre(-0.25, 0.25) * this.W
    this.tempestade = { t0: t, dur: 2.9, luzPos: { x: ox, y: this.H * 0.08 }, luz: 0, marca: null }
    // o golpe principal (com re-golpe embutido no envelope) e raios menores em volta
    this.depois(0.28, () => {
      this.raio({ x: ox, y: -30 }, alvo, 4.4, COR.azul, [0.92, 0.97, 1], 1.6)
      this.tempestade!.marca = { x: alvo.x, y: alvo.y, t0: this.t }
      this.faiscasEletricas(alvo, 34)
      this.onda(alvo.x, alvo.y, { vel: 700, forca: 0.6, dur: 0.6, cor: COR.azulClaro })
      this.sacudir(7)
    })
    this.depois(0.62, () => {
      const x = this.W * entre(0.05, 0.45)
      this.raio({ x, y: this.H * entre(0.06, 0.16) }, { x: x + this.W * entre(0.35, 0.55), y: this.H * entre(0.1, 0.22) }, 1.8, COR.azul, [0.85, 0.92, 1], 0.9)
    })
    this.depois(1.15, () => {
      const p = { x: alvo.x + entre(-80, 80), y: alvo.y + entre(-40, 60) }
      this.raio({ x: p.x + entre(-60, 60), y: -30 }, p, 2.6, COR.azul, [0.9, 0.96, 1], 1)
      this.faiscasEletricas(p, 14)
    })
    // eletricidade correndo pelas bordas da tela e dos cartões
    for (let k = 0; k < 14; k++) this.depois(0.35 + k * 0.12, () => this.arcoBorda())
  }

  /** Um arco curto correndo por uma borda (da tela ou de um cartão visível). */
  arcoBorda() {
    const W = this.W
    const H = this.H
    let a: Pt
    let b: Pt
    if (this.bordas.length && R() < 0.6) {
      const r = escolha(this.bordas)
      const lado = (R() * 4) | 0
      const L = entre(50, 120)
      if (lado < 2) {
        const y = lado === 0 ? r.top : r.bottom
        const x = entre(r.left, Math.max(r.left, r.right - L))
        a = { x, y }
        b = { x: x + L, y }
      } else {
        const x = lado === 2 ? r.left : r.right
        const y = entre(r.top, Math.max(r.top, r.bottom - L))
        a = { x, y }
        b = { x, y: y + L }
      }
    } else {
      const lado = (R() * 4) | 0
      const L = entre(90, 180)
      const m = 3
      if (lado === 0) {
        const y = entre(0, H - L)
        a = { x: m, y }
        b = { x: m, y: y + L }
      } else if (lado === 1) {
        const y = entre(0, H - L)
        a = { x: W - m, y }
        b = { x: W - m, y: y + L }
      } else if (lado === 2) {
        const x = entre(0, W - L)
        a = { x, y: m }
        b = { x: x + L, y: m }
      } else {
        const x = entre(0, W - L)
        a = { x, y: H - m }
        b = { x: x + L, y: H - m }
      }
    }
    const r = gerarRaio(a, b, { niveis: 5, desvio: 0.12, galhos: 0.3 })
    for (const g of r.galhos) this.fios.push({ pts: g.pts, t0: this.t, vida: entre(0.12, 0.22), larg: 5 * g.w, halo: R() < 0.5 ? COR.azul : COR.ciano })
  }

  faiscasEletricas(p: Pt, n: number) {
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + entre(-1.3, 1.3)
      const v = entre(180, 620)
      this.add({ x: p.x, y: p.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 1100, atrito: 1.2, max: entre(0.35, 0.8), tam0: entre(4, 7), tam1: 2, cor: R() < 0.5 ? COR.azulClaro : COR.ciano, a0: 1.6, a1: 0, chao: p.y + 4, quique: 0.35 })
    }
  }

  iniciarImpacto(p: Pt) {
    const t = this.t
    this.sacudir(20)
    this.onda(p.x, p.y, { vel: 1100, forca: 1.2, dur: 0.8, cor: [1, 0.75, 0.4] })
    this.onda(p.x, p.y, { vel: 760, forca: 0.9, dur: 1, cor: COR.vermelho, atraso: 0.08 })
    this.onda(p.x, p.y, { vel: 480, forca: 0.5, dur: 1.1, cor: COR.fogo, atraso: 0.18 })
    this.poco = { x: p.x, y: p.y, t0: t, r: 46 }
    // rachaduras irradiando do ponto, com galhos
    const n = 7 + ((R() * 3) | 0)
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2 + entre(-0.25, 0.25)
      const len = entre(70, 190)
      const r = gerarRaio(p, { x: p.x + Math.cos(ang) * len, y: p.y + Math.sin(ang) * len * 0.62 }, { niveis: 5, desvio: 0.22, galhos: 0.45 })
      r.galhos.forEach((g, k) => this.rachas.push({ pts: g.pts, t0: t + k * 0.03, larg: k === 0 ? 1 : 0.6 }))
    }
    // pedras com física (quicam num "chão" logo abaixo do ponto)
    for (let i = 0; i < 18; i++) {
      const a = -Math.PI / 2 + entre(-1.25, 1.25)
      const v = entre(260, 820)
      const tom = entre(0.75, 1.2)
      this.add({ x: p.x + entre(-10, 10), y: p.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 1700, atrito: 0.4, max: entre(1.6, 2.6), tam0: entre(6, 15), tam1: entre(5, 12), cor: [0.38 * tom, 0.3 * tom, 0.26 * tom], a0: 3, a1: 0, tipo: 1, chao: p.y + entre(30, 110), quique: 0.32, aditiva: false })
    }
    // brasas
    for (let i = 0; i < 26; i++) {
      const a = -Math.PI / 2 + entre(-1.1, 1.1)
      const v = entre(200, 700)
      this.add({ x: p.x, y: p.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 900, atrito: 1, max: entre(0.6, 1.3), tam0: entre(4, 8), tam1: 2, cor: escolha([COR.laranja, COR.fogo, [1, 0.85, 0.5] as RGB]), a0: 1.5, a1: 0, chao: p.y + entre(30, 100), quique: 0.4 })
    }
    // poeira que sobe e se espalha devagar
    for (let i = 0; i < 12; i++) {
      const a = entre(0, Math.PI * 2)
      const v = entre(30, 140)
      this.add({ x: p.x + entre(-20, 20), y: p.y + entre(-10, 10), vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.5 - 30, atrito: 1.4, max: entre(2.2, 3.4), tam0: entre(30, 50), tam1: entre(110, 170), cor: [0.42, 0.35, 0.31], a0: 0.55, a1: 0, tipo: 2, aditiva: false })
    }
  }

  /** Começa a carregar a rajada: a energia é sugada para a ponta do dedo. */
  iniciarCarga(p: Pt) {
    this.feixe = { a: { ...p }, b: { ...p }, t0: this.t, carga: 0, fase: 'carga', tc: this.t, larg: 0, ultArco: 0 }
  }
  moverCarga(p: Pt) {
    if (this.feixe?.fase === 'carga') this.feixe.a = { ...p }
  }
  cancelarCarga() {
    if (this.feixe?.fase === 'carga') this.feixe = null
  }
  /** Solta: o feixe sai da ponta do dedo na direção do toque (de quem segura o celular para a tela). */
  disparar() {
    const f = this.feixe
    if (!f || f.fase !== 'carga') return 0
    const carga = Math.min(1, f.carga)
    if (carga < 0.15) {
      this.feixe = null
      return 0
    }
    const a = f.a
    let dx = a.x - this.W / 2
    let dy = a.y - (this.H + 60)
    const L = Math.hypot(dx, dy) || 1
    dx /= L
    dy /= L
    if (dy > -0.25) dy = -0.25 // nunca para baixo
    const n = Math.hypot(dx, dy)
    dx /= n
    dy /= n
    // até a borda da tela
    const tx = dx > 0 ? (this.W + 40 - a.x) / dx : dx < 0 ? (-40 - a.x) / dx : Infinity
    const ty = (-40 - a.y) / dy
    const s = Math.min(tx, ty)
    const b = { x: a.x + dx * s, y: a.y + dy * s }
    this.feixe = { a, b, t0: this.t, carga, fase: 'disparo', tc: this.t, larg: 16 + 24 * carga, ultArco: 0 }
    this.calor = { a, b, t0: this.t, larg: 40 + 50 * carga }
    this.sacudir(5 + 6 * carga)
    // faíscas na boca do disparo
    for (let i = 0; i < 18; i++) {
      const ang = Math.atan2(dy, dx) + Math.PI + entre(-1.2, 1.2)
      const v = entre(120, 420)
      this.add({ x: a.x, y: a.y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, g: 600, atrito: 2, max: entre(0.3, 0.7), tam0: entre(3, 6), tam1: 1.5, cor: escolha([COR.laranja, COR.ceu]), a0: 1.4, a1: 0 })
    }
    // fumaça que fica no caminho do feixe e se dissipa devagar
    this.depois(0.3, () => {
      for (let i = 0; i < 12; i++) {
        const k = R()
        const x = a.x + (b.x - a.x) * k * 0.8
        const y = a.y + (b.y - a.y) * k * 0.8
        this.add({ x: x + entre(-12, 12), y: y + entre(-12, 12), vx: entre(-20, 20), vy: entre(-35, -10), atrito: 0.8, max: entre(2.4, 3.8), tam0: entre(24, 40), tam1: entre(90, 150), cor: [0.3, 0.29, 0.31], a0: 0.45, a1: 0, tipo: 2, aditiva: false })
      }
    })
    return carga
  }

  /** Magia: a névoa segue o dedo (chamado a cada movimento enquanto ele gira). */
  alimentarNevoa(p: Pt) {
    if (!this.nevoa) this.nevoa = { pts: [], ativa: true, ultimo: 0 }
    const n = this.nevoa
    n.ativa = true
    const u = n.pts[n.pts.length - 1]
    if (!u || Math.hypot(p.x - u.x, p.y - u.y) > 12 || this.t - n.ultimo > 0.06) {
      n.pts.push({ x: p.x, y: p.y, t0: this.t })
      n.ultimo = this.t
      if (n.pts.length > 24) n.pts.shift()
      // fiapos dourados soltos (estrelinhas)
      if (R() < 0.5) {
        this.add({ x: p.x + entre(-20, 20), y: p.y + entre(-20, 20), vx: entre(-30, 30), vy: entre(-60, -15), atrito: 0.8, max: entre(0.8, 1.5), tam0: entre(7, 13), tam1: 2, cor: R() < 0.7 ? COR.ouro : COR.turquesa, a0: 1, a1: 0, tipo: 3 })
      }
    }
  }
  fimNevoa() {
    if (this.nevoa) this.nevoa.ativa = false
  }

  iniciarPortal(c: Pt, r: number) {
    this.portal = { c: { ...c }, r: Math.max(64, Math.min(r, Math.min(this.W, this.H) * 0.42)), t0: this.t, dur: 3.6 }
  }

  iniciarCosmico(c: Pt) {
    const cores = [COR.azul, COR.ciano, COR.ouro, COR.laranja, COR.ciano, COR.ouro, COR.azulClaro]
    const n = 6
    const orbes: Orbe[] = []
    for (let i = 0; i < n; i++) {
      // nascem fora do ponto, em volta, com velocidade de órbita
      const a = (i / n) * Math.PI * 2 + entre(-0.3, 0.3)
      const d = entre(0.38, 0.55) * Math.max(this.W, this.H)
      const x = c.x + Math.cos(a) * d
      const y = c.y + Math.sin(a) * d
      const v = entre(160, 260)
      orbes.push({ x, y, vx: -Math.sin(a) * v, vy: Math.cos(a) * v, cor: cores[i % cores.length], tam: entre(30, 46), rastro: [], vivo: true })
    }
    this.cosmico = { c: { ...c }, t0: this.t, fase: 'reunir', te: 0, orbes, nucleo: 0 }
  }
  moverCosmico(c: Pt) {
    if (this.cosmico?.fase === 'reunir') this.cosmico.c = { ...c }
  }
  /** A energia reunida explode numa onda de luz com poeira cósmica dourada. */
  explodirCosmico() {
    const k = this.cosmico
    if (!k || k.fase !== 'reunir') return
    k.fase = 'explodir'
    k.te = this.t
    const c = k.c
    const forca = 0.6 + 0.4 * Math.min(1, (this.t - k.t0) / 1.2)
    this.onda(c.x, c.y, { vel: 1200, forca: 1.1 * forca, dur: 1, cor: COR.ouro })
    this.onda(c.x, c.y, { vel: 820, forca: 0.8 * forca, dur: 1.2, cor: COR.ciano, atraso: 0.07 })
    this.onda(c.x, c.y, { vel: 520, forca: 0.5 * forca, dur: 1.3, cor: COR.azul, atraso: 0.16 })
    this.sacudir(10 * forca)
    const n = Math.min(110, this.maxPart * 0.45)
    for (let i = 0; i < n; i++) {
      const a = entre(0, Math.PI * 2)
      const v = entre(120, 760) * forca
      const estrela = R() < 0.25
      this.add({ x: c.x, y: c.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, atrito: 2.4, g: -14, max: entre(1.8, 3.4), tam0: estrela ? entre(9, 16) : entre(3, 7), tam1: estrela ? 2 : 1.5, cor: escolha([COR.ouro, COR.ouro, COR.laranja, COR.ciano, [1, 0.92, 0.7] as RGB]), a0: 1.3, a1: 0, tipo: estrela ? 3 : 0 })
    }
  }

  /* ---------------- passo da simulação ---------------- */
  passo(dt: number) {
    this.t += dt
    const t = this.t
    // agenda
    if (this.agenda.length) {
      const prontos = this.agenda.filter((a) => a.t <= t)
      this.agenda = this.agenda.filter((a) => a.t > t)
      prontos.forEach((a) => a.fn())
    }
    this.amp *= Math.exp(-dt * 7)
    if (this.amp < 0.2) this.amp = 0

    // carga da rajada: sugando energia
    const f = this.feixe
    if (f?.fase === 'carga') {
      f.carga = Math.min(1.2, (t - f.t0) / 1.1)
      for (let i = 0, n = quantos(70 * dt); i < n; i++) {
        const a = entre(0, Math.PI * 2)
        const d = entre(70, 160)
        this.add({ x: f.a.x + Math.cos(a) * d, y: f.a.y + Math.sin(a) * d, vx: -Math.sin(a) * 60, vy: Math.cos(a) * 60, max: 1.2, tam0: entre(4, 8), tam1: 2, cor: R() < 0.6 ? COR.laranja : COR.ceu, a0: 0.2, a1: 1.2, alvo: { x: f.a.x, y: f.a.y, forca: 1400, giro: 200, mata: 10 } })
      }
      // arcos curtos azuis saltando para a esfera
      if (t - f.ultArco > 0.16) {
        f.ultArco = t
        const a = entre(0, Math.PI * 2)
        const d = entre(50, 90)
        const r = gerarRaio({ x: f.a.x + Math.cos(a) * d, y: f.a.y + Math.sin(a) * d }, f.a, { niveis: 5, desvio: 0.25, galhos: 0.4 })
        for (const g of r.galhos) this.fios.push({ pts: g.pts, t0: t, vida: 0.1, larg: 4 * g.w, halo: COR.ceu })
      }
      // os alvos das partículas acompanham o dedo
      for (const p of this.ps) if (p.alvo && p.alvo.mata === 10) ((p.alvo.x = f.a.x), (p.alvo.y = f.a.y))
    } else if (f?.fase === 'disparo') {
      const age = t - f.t0
      if (age > 1.05) this.feixe = null
      else if (age < 0.45 && R() < 0.8) {
        // faíscas no ponto onde o feixe bate
        const ang = Math.atan2(f.a.y - f.b.y, f.a.x - f.b.x) + entre(-1, 1)
        const v = entre(150, 500)
        this.add({ x: f.b.x, y: f.b.y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, g: 500, atrito: 1.5, max: entre(0.3, 0.7), tam0: entre(3, 7), tam1: 1.5, cor: escolha([COR.laranja, [1, 0.9, 0.6] as RGB, COR.ceu]), a0: 1.3, a1: 0 })
      }
    }
    if (this.calor && t - this.calor.t0 > 1.8) this.calor = null

    // portal: estrelas puxadas em espiral e faíscas no aro
    const pt = this.portal
    if (pt) {
      const age = t - pt.t0
      if (age > pt.dur) this.portal = null
      else if (age < pt.dur - 0.5) {
        for (let i = 0, n = quantos(40 * dt); i < n; i++) {
          const a = entre(0, Math.PI * 2)
          const d = pt.r * entre(1.3, 2.4)
          this.add({ x: pt.c.x + Math.cos(a) * d, y: pt.c.y + Math.sin(a) * d, max: 2.5, tam0: entre(5, 11), tam1: 2, cor: escolha([COR.branco, COR.turquesa, COR.ouro, [0.8, 0.85, 1] as RGB]), a0: 0, a1: 2.5, tipo: 3, alvo: { x: pt.c.x, y: pt.c.y, forca: 300, giro: 560, mata: pt.r * 0.5 } })
        }
        if (R() < 0.5) {
          const a = entre(0, Math.PI * 2)
          const rr = pt.r * 1.04
          this.add({ x: pt.c.x + Math.cos(a) * rr, y: pt.c.y + Math.sin(a) * rr, vx: -Math.sin(a) * 260, vy: Math.cos(a) * 260, atrito: 3, max: entre(0.3, 0.6), tam0: entre(3, 6), tam1: 1, cor: COR.ouro, a0: 1.3, a1: 0 })
        }
      }
    }

    // energia cósmica: esferas com rastro de cometa espiralando para o ponto
    const k = this.cosmico
    if (k) {
      if (k.fase === 'reunir') {
        const age = t - k.t0
        const puxa = 260 + age * 900
        for (const o of k.orbes) {
          if (!o.vivo) continue
          const dx = k.c.x - o.x
          const dy = k.c.y - o.y
          const d = Math.hypot(dx, dy) || 1
          // gravidade + giro (órbita que vai fechando)
          o.vx += ((dx / d) * puxa - (dy / d) * 120) * dt
          o.vy += ((dy / d) * puxa + (dx / d) * 120) * dt
          o.vx *= Math.exp(-dt * 1.1)
          o.vy *= Math.exp(-dt * 1.1)
          o.x += o.vx * dt
          o.y += o.vy * dt
          o.rastro.push({ x: o.x, y: o.y })
          if (o.rastro.length > 18) o.rastro.shift()
          if (d < 22 && age > 0.4) {
            o.vivo = false
            k.nucleo = Math.min(1, k.nucleo + 1 / k.orbes.length)
          }
          if (R() < 0.35) this.add({ x: o.x, y: o.y, vx: entre(-25, 25), vy: entre(-25, 25), atrito: 1, max: entre(0.5, 0.9), tam0: entre(3, 5), tam1: 1, cor: COR.ouro, a0: 0.9, a1: 0, tipo: 0 })
        }
        // reuniu tudo e a pessoa continua segurando: o núcleo pulsa até soltar (máx. 4 s)
        if (age > 4) this.explodirCosmico()
      } else if (t - k.te > 1.4) this.cosmico = null
    }

    // partículas
    for (let i = this.ps.length - 1; i >= 0; i--) {
      const p = this.ps[i]
      p.vida += dt
      if (p.vida > p.max) {
        this.ps.splice(i, 1)
        continue
      }
      if (p.alvo) {
        const dx = p.alvo.x - p.x
        const dy = p.alvo.y - p.y
        const d = Math.hypot(dx, dy) || 1
        if (p.alvo.mata && d < p.alvo.mata) {
          this.ps.splice(i, 1)
          continue
        }
        const f2 = p.alvo.forca / Math.max(0.35, d / 120)
        p.vx += ((dx / d) * f2 - (dy / d) * p.alvo.giro * (60 / Math.max(d, 30))) * dt
        p.vy += ((dy / d) * f2 + (dx / d) * p.alvo.giro * (60 / Math.max(d, 30))) * dt
        p.vx *= Math.exp(-dt * 2.2)
        p.vy *= Math.exp(-dt * 2.2)
      } else if (p.atrito) {
        const a = Math.exp(-dt * p.atrito)
        p.vx *= a
        p.vy *= a
      }
      p.vy += p.g * dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      if (p.chao !== undefined && p.y > p.chao && p.vy > 0) {
        p.y = p.chao
        p.vy *= -(p.quique ?? 0.35)
        p.vx *= 0.72
      }
    }
    this.raios = this.raios.filter((r) => t - r.t0 < 0.9)
    this.fios = this.fios.filter((f2) => t - f2.t0 < f2.vida)
    this.rachas = this.rachas.filter((r) => t - r.t0 < 4.2)
    this.ondas = this.ondas.filter((o) => t - o.t0 < o.dur)
    if (this.tempestade && t - this.tempestade.t0 > this.tempestade.dur) this.tempestade = null
    if (this.poco && t - this.poco.t0 > 3) this.poco = null
    if (this.nevoa) {
      const n = this.nevoa
      n.pts = n.pts.filter((p) => t - p.t0 < 1.8)
      if (!n.ativa && !n.pts.length) this.nevoa = null
    }
  }

  vivo() {
    return !!(
      this.ps.length ||
      this.raios.length ||
      this.fios.length ||
      this.rachas.length ||
      this.ondas.length ||
      this.tempestade ||
      this.poco ||
      this.feixe ||
      this.calor ||
      this.nevoa ||
      this.portal ||
      this.cosmico ||
      this.agenda.length ||
      this.amp
    )
  }

  /* ---------------- monta o quadro ---------------- */
  quadro(): Quadro {
    const t = this.t
    const linhas: Linha[] = []
    const escuras: Linha[] = []
    let luzRaio = 0

    for (const rv of this.raios) {
      const age = t - rv.t0
      if (age < 0) continue
      luzRaio = Math.max(luzRaio, envelope(age))
      for (const g of rv.r.galhos) {
        const a = envelope(age, g.vida)
        if (a <= 0.01) continue
        const w = rv.lw * g.w
        linhas.push({ pts: g.pts, larg: w * 9, halo: rv.halo, nucleo: rv.nuc, nucLarg: w * 0.9, alfa: a })
      }
    }
    for (const f of this.fios) {
      const k = (t - f.t0) / f.vida
      const a = (1 - k) * (0.6 + 0.4 * Math.sin(t * 90 + f.pts.length))
      linhas.push({ pts: f.pts, larg: f.larg * 2.4, halo: f.halo, nucleo: [0.9, 0.97, 1], nucLarg: f.larg * 0.3, alfa: Math.max(0, a) })
    }
    // rachaduras: fissura escura + brasa por dentro que esfria (amarelo → laranja → vermelho)
    for (const r of this.rachas) {
      const age = t - r.t0
      if (age < 0) continue
      const cresce = ss(0, 0.14, age)
      const n = Math.max(2, Math.ceil(r.pts.length * cresce))
      const pts = r.pts.slice(0, n)
      const some = 1 - ss(3.2, 4.2, age)
      escuras.push({ pts, larg: 3.4 * r.larg, halo: [0.03, 0.015, 0.02], nucleo: [0, 0, 0], nucLarg: 1, alfa: 0.88 * some, escura: true })
      const calor = 1 - ss(0, 2.6, age)
      if (calor > 0.02) {
        const c = temperatura(calor)
        linhas.push({ pts, larg: 7 * r.larg, halo: c, nucleo: temperatura(Math.min(1, calor + 0.25)), nucLarg: 1.1 * r.larg, alfa: Math.min(1, calor * 1.4) })
      }
    }

    // energia cósmica: rastros de cometa e esferas de luz macia
    const k = this.cosmico
    const extraLuz: Particula[] = []
    if (k) {
      const base = { vx: 0, vy: 0, g: 0, atrito: 0, vida: 0, max: 1, a1: 1, seed: 0, aditiva: true }
      if (k.fase === 'reunir') {
        for (const o of k.orbes) {
          if (!o.vivo || o.rastro.length < 3) continue
          const n = o.rastro.length
          const terco = Math.floor(n / 3)
          // três pedaços: o mais perto da esfera mais forte e largo
          ;[
            [o.rastro.slice(2 * terco), 1, 1],
            [o.rastro.slice(terco, 2 * terco + 1), 0.55, 0.7],
            [o.rastro.slice(0, terco + 1), 0.25, 0.45],
          ].forEach(([pts, a, w]) => {
            const ps = pts as Pt[]
            if (ps.length > 1) linhas.push({ pts: ps, larg: 14 * (w as number), halo: o.cor, nucleo: [1, 0.97, 0.9], nucLarg: 2.2 * (w as number), alfa: a as number })
          })
          extraLuz.push({ ...base, x: o.x, y: o.y, tam0: o.tam, tam1: o.tam, cor: o.cor, a0: 0.95, tipo: 0 })
        }
        const pulso = 0.85 + 0.15 * Math.sin(t * 14)
        const tam = (18 + k.nucleo * 70) * pulso
        extraLuz.push({ ...base, x: k.c.x, y: k.c.y, tam0: tam, tam1: tam, cor: COR.ouro, a0: 0.5 + k.nucleo * 0.5, tipo: 0 })
        extraLuz.push({ ...base, x: k.c.x, y: k.c.y, tam0: tam * 2.2, tam1: tam * 2.2, cor: COR.azul, a0: 0.18 + k.nucleo * 0.2, tipo: 0 })
      } else {
        const e = 1 - ss(0, 0.5, t - k.te)
        if (e > 0) extraLuz.push({ ...base, x: k.c.x, y: k.c.y, tam0: 140 * (1 + (1 - e)), tam1: 0, cor: [1, 0.9, 0.7], a0: e * 0.9, tipo: 0 })
      }
    }

    const luz: Particula[] = []
    const sobre: Particula[] = []
    for (const p of this.ps) (p.aditiva ? luz : sobre).push(p)
    luz.push(...extraLuz)

    const ondas = this.ondas
      .filter((o) => t >= o.t0)
      .map((o) => {
        const age = t - o.t0
        const kk = age / o.dur
        return { x: o.x, y: o.y, r: o.vel * age * (1 - 0.35 * kk), forca: o.forca * Math.pow(1 - kk, 1.5), cor: o.cor }
      })

    let tempestade: Quadro['tempestade'] = null
    if (this.tempestade) {
      const tp = this.tempestade
      const age = t - tp.t0
      const alfa = ss(0, 0.35, age) * (1 - ss(tp.dur - 0.8, tp.dur, age))
      const marca: [number, number, number, number] = tp.marca ? [tp.marca.x, tp.marca.y, t - tp.marca.t0, 1] : [0, 0, 0, 0]
      tempestade = { alfa, luz: luzRaio, luzPos: tp.luzPos, marca }
    }
    const poco: Quadro['poco'] = this.poco ? [this.poco.x, this.poco.y, this.poco.r, Math.max(0, 1 - (t - this.poco.t0) / 2.6)] : null

    let feixe: Quadro['feixe'] = null
    const f = this.feixe
    if (f) {
      if (f.fase === 'carga') feixe = { a: f.a, b: f.a, larg: 0, forca: 0, alcance: 0, carga: Math.min(1, f.carga) }
      else {
        const age = t - f.t0
        feixe = { a: f.a, b: f.b, larg: f.larg, forca: age < 0.35 ? 1 : Math.max(0, 1 - (age - 0.35) / 0.7), alcance: ss(0, 0.11, age), carga: 0 }
      }
    }
    const nevoa: Quadro['nevoa'] = this.nevoa
      ? { pts: this.nevoa.pts.map((p) => [p.x, p.y, Math.min(1, (t - p.t0) / 1.8)] as [number, number, number]), alfa: 1 }
      : null

    let portal: Quadro['portal'] = null
    let lente: Quadro['lente'] = [0, 0, 0, 0]
    if (this.portal) {
      const pt = this.portal
      const age = t - pt.t0
      // abre com um pequeno "passo" (passa do tamanho e volta) e fecha no fim
      const a = ss(0, 0.7, age)
      const passa = 1 + 0.08 * Math.sin(Math.min(1, age / 0.7) * Math.PI)
      const abre = a * passa * (1 - ss(pt.dur - 0.5, pt.dur, age))
      portal = { c: pt.c, r: pt.r, abre }
      lente = [pt.c.x, pt.c.y, pt.r * abre, abre]
    } else if (k?.fase === 'reunir') lente = [k.c.x, k.c.y, 60 + k.nucleo * 60, 0.5 * k.nucleo]

    let calor: Quadro['calor'] = [0, 0, 0, 0, 0, 0]
    if (this.calor) {
      const c = this.calor
      const age = t - c.t0
      calor = [c.a.x, c.a.y, c.b.x, c.b.y, c.larg, Math.max(0, 1 - age / 1.8)]
    }

    const s = this.amp
    return {
      t,
      shake: [(R() - 0.5) * 2 * s, (R() - 0.5) * 2 * s],
      linhas,
      escuras,
      luz,
      sobre,
      tempestade,
      ondas,
      poco,
      feixe,
      nevoa,
      portal,
      lente,
      calor,
      ativo: this.vivo(),
    }
  }
}
