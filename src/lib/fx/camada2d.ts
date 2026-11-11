/**
 * Camada de efeitos 2D por cima do convite (canvas fixo + clarão):
 * raios fractais com brilho, faíscas com física (gravidade, atrito, quique) e clarão suave.
 * Usada pelos efeitos pequenos espalhados pelo convite (raio no título, faíscas do dedo,
 * descargas da contagem) e como fallback dos poderes. O loop só roda enquanto há algo vivo.
 */
import { perf } from '../perf'
import { desenharRaio2D, gerarRaio, type Pt, type Raio } from './raio'
import { CLARAO_MAX, podeClarear } from './clarao'

interface Faisca {
  x: number
  y: number
  vx: number
  vy: number
  vida: number
  max: number
  tam: number
  /** 0 = elétrica (azul-branca), 1 = brasa (laranja), 2 = dourada */
  tipo: number
  chao: number
}

let canvas: HTMLCanvasElement | null = null
let flash: HTMLElement | null = null
let ctx: CanvasRenderingContext2D | null = null
let W = 0
let H = 0
let dpr = 1
let raf = 0
let ultimo = 0
const raios: { r: Raio; t0: number; lw: number }[] = []
const faiscas: Faisca[] = []
let sprites: HTMLCanvasElement[] = []

/** Brilho redondo e macio (núcleo claro + halo colorido), pré-renderizado. */
function sprite(nucleo: string, halo: string) {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')!
  const rg = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  rg.addColorStop(0, nucleo)
  rg.addColorStop(0.18, nucleo)
  rg.addColorStop(0.35, halo)
  rg.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = rg
  g.fillRect(0, 0, 64, 64)
  return c
}

function garantir() {
  if (canvas || typeof document === 'undefined') return
  canvas = document.createElement('canvas')
  canvas.className = 'fx-2d'
  canvas.setAttribute('aria-hidden', 'true')
  flash = document.createElement('div')
  flash.className = 'clarao'
  flash.setAttribute('aria-hidden', 'true')
  document.body.append(flash, canvas)
  ctx = canvas.getContext('2d')
  sprites = [
    sprite('rgba(240,248,255,1)', 'rgba(110,170,255,.55)'),
    sprite('rgba(255,240,200,1)', 'rgba(255,120,30,.55)'),
    sprite('rgba(255,248,220,1)', 'rgba(255,190,60,.5)'),
  ]
  const resize = () => {
    dpr = Math.min(perf.isLite() ? 1 : 1.5, devicePixelRatio || 1)
    W = innerWidth
    H = innerHeight
    canvas!.width = Math.round(W * dpr)
    canvas!.height = Math.round(H * dpr)
  }
  resize()
  addEventListener('resize', resize, { passive: true })
}

function loop(now: number) {
  if (!ctx) return
  const dt = Math.min(0.05, (now - ultimo) / 1000)
  ultimo = now
  const t = now / 1000
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, W, H)
  for (let i = raios.length - 1; i >= 0; i--) {
    const r = raios[i]
    if (t - r.t0 > 0.9) raios.splice(i, 1)
    else desenharRaio2D(ctx, r.r, t - r.t0, r.lw)
  }
  ctx.globalCompositeOperation = 'lighter'
  for (let i = faiscas.length - 1; i >= 0; i--) {
    const f = faiscas[i]
    f.vida += dt
    if (f.vida > f.max) {
      faiscas.splice(i, 1)
      continue
    }
    f.vx *= Math.exp(-dt * 1.6)
    f.vy = f.vy * Math.exp(-dt * 1.2) + 900 * dt * (f.tipo === 2 ? -0.08 : 1)
    const px = f.x
    const py = f.y
    f.x += f.vx * dt
    f.y += f.vy * dt
    // quica no "chão" (perde energia)
    if (f.y > f.chao && f.vy > 0) {
      f.y = f.chao
      f.vy *= -0.35
      f.vx *= 0.7
    }
    const k = 1 - f.vida / f.max
    // rastro curto (faísca em movimento parece um traço) + ponto brilhante
    ctx.strokeStyle = f.tipo === 1 ? `rgba(255,170,80,${0.5 * k})` : f.tipo === 2 ? `rgba(255,210,120,${0.45 * k})` : `rgba(170,210,255,${0.55 * k})`
    ctx.lineWidth = f.tam * 0.5
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(px - (f.x - px) * 0.6, py - (f.y - py) * 0.6)
    ctx.lineTo(f.x, f.y)
    ctx.stroke()
    const s = f.tam * (2.2 + 2 * k)
    ctx.globalAlpha = Math.min(1, k * 1.5)
    ctx.drawImage(sprites[f.tipo], f.x - s, f.y - s, s * 2, s * 2)
    ctx.globalAlpha = 1
  }
  ctx.globalCompositeOperation = 'source-over'
  if (raios.length || faiscas.length) raf = requestAnimationFrame(loop)
  else {
    ctx.clearRect(0, 0, W, H)
    raf = 0
  }
}

function acordar() {
  if (raf) return
  ultimo = performance.now()
  raf = requestAnimationFrame(loop)
}

export const fx2d = {
  /** Raio fractal de `a` até `b`. */
  raio(a: Pt, b: Pt, o: { lw?: number; galhos?: number } = {}) {
    if (perf.reducedMotion) return
    garantir()
    raios.push({ r: gerarRaio(a, b, { niveis: 8, galhos: o.galhos ?? 1.2 }), t0: performance.now() / 1000, lw: o.lw ?? 3 })
    acordar()
  },
  /** Faíscas saindo de um ponto (com gravidade e quique em `chao`). */
  faiscas(x: number, y: number, n: number, o: { tipo?: 0 | 1 | 2; forca?: number; chao?: number; vida?: number } = {}) {
    if (perf.reducedMotion) return
    garantir()
    const max = perf.isLite() ? 70 : 120
    const forca = o.forca ?? 420
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.5
      const v = forca * (0.35 + Math.random() * 0.75)
      faiscas.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        vida: 0,
        max: (o.vida ?? 0.7) * (0.6 + Math.random() * 0.7),
        tam: 1.2 + Math.random() * 1.6,
        tipo: o.tipo ?? 0,
        chao: o.chao ?? H + 40,
      })
    }
    if (faiscas.length > max) faiscas.splice(0, faiscas.length - max)
    acordar()
  },
  /**
   * Clarão suave na cor pedida (limitado a 3/s; nunca branco puro, opacidade ≤ CLARAO_MAX).
   * `cor` = "r g b" do brilho principal; o padrão é o azul do relâmpago.
   */
  clarao(forca = 1, cor = '200 225 255', y = 25) {
    garantir()
    if (!flash || !podeClarear()) return
    flash.style.background = `radial-gradient(90% 60% at 50% ${y}%, rgb(${cor} / .85), rgb(${cor} / .3) 60%, rgb(${cor} / .08))`
    flash.animate(
      [{ opacity: 0 }, { opacity: CLARAO_MAX * forca, offset: 0.12 }, { opacity: CLARAO_MAX * forca * 0.25, offset: 0.32 }, { opacity: CLARAO_MAX * forca * 0.7, offset: 0.44 }, { opacity: 0 }],
      { duration: 560, easing: 'ease-out' },
    )
  },
}
