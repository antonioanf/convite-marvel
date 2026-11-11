/**
 * Fallback em canvas 2D para aparelhos fracos (ou sem WebGL): desenha o mesmo `Quadro` da simulação
 * com gradientes e traços em camadas (sem shadowBlur, que é caro). Menos detalhe, mesmas cores.
 */
import type { Linha, Particula } from './gl/render'
import type { Quadro, RGB } from './sim'

const css = (c: RGB, a: number) => `rgba(${(c[0] * 255) | 0},${(c[1] * 255) | 0},${(c[2] * 255) | 0},${Math.max(0, Math.min(1, a)).toFixed(3)})`

/** Sprites de brilho por cor (cache): núcleo claro + halo colorido. */
const sprites = new Map<string, HTMLCanvasElement>()
function brilho(c: RGB) {
  const k = c.map((v) => Math.round(v * 8)).join(',')
  let s = sprites.get(k)
  if (s) return s
  s = document.createElement('canvas')
  s.width = s.height = 64
  const g = s.getContext('2d')!
  const rg = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  rg.addColorStop(0, 'rgba(255,255,255,1)')
  rg.addColorStop(0.16, css(c.map((v) => Math.min(1, v * 0.5 + 0.55)) as RGB, 1))
  rg.addColorStop(0.42, css(c, 0.4))
  rg.addColorStop(1, css(c, 0))
  g.fillStyle = rg
  g.fillRect(0, 0, 64, 64)
  sprites.set(k, s)
  return s
}
let fumaca: HTMLCanvasElement | null = null
function spriteFumaca() {
  if (fumaca) return fumaca
  fumaca = document.createElement('canvas')
  fumaca.width = fumaca.height = 64
  const g = fumaca.getContext('2d')!
  const rg = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  rg.addColorStop(0, 'rgba(255,255,255,.7)')
  rg.addColorStop(0.5, 'rgba(255,255,255,.3)')
  rg.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = rg
  g.fillRect(0, 0, 64, 64)
  return fumaca
}

function caminho(ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[]) {
  ctx.beginPath()
  ctx.moveTo(pts[0].x, pts[0].y)
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
}

function linhaLuz(ctx: CanvasRenderingContext2D, l: Linha) {
  if (l.pts.length < 2 || l.alfa <= 0.01) return
  caminho(ctx, l.pts)
  ctx.lineWidth = l.larg * 1.6
  ctx.strokeStyle = css(l.halo, 0.12 * l.alfa)
  ctx.stroke()
  ctx.lineWidth = l.larg * 0.6
  ctx.strokeStyle = css(l.halo, 0.35 * l.alfa)
  ctx.stroke()
  ctx.lineWidth = Math.max(1, l.nucLarg * 1.6)
  ctx.strokeStyle = css(l.nucleo, l.alfa)
  ctx.stroke()
}

function particula(ctx: CanvasRenderingContext2D, p: Particula) {
  const k = Math.min(1, p.vida / p.max)
  const a = Math.min(1, Math.max(0, p.a0 + (p.a1 - p.a0) * k))
  if (a <= 0.01) return
  const tam = p.tam0 + (p.tam1 - p.tam0) * k
  if (p.tipo === 1) {
    // pedra: polígono irregular com o lado de cima mais claro
    ctx.globalAlpha = a
    ctx.fillStyle = css(p.cor, 1)
    ctx.beginPath()
    const r = tam / 2
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2 + p.seed * 6
      const rr = r * (0.7 + 0.3 * Math.sin(p.seed * 40 + i * 2.1))
      ctx.lineTo(p.x + Math.cos(ang) * rr, p.y + Math.sin(ang) * rr)
    }
    ctx.fill()
    ctx.globalAlpha = 1
    return
  }
  if (p.tipo === 2) {
    ctx.globalAlpha = a * 0.8
    ctx.drawImage(spriteFumaca(), p.x - tam / 2, p.y - tam / 2, tam, tam)
    ctx.globalAlpha = 1
    return
  }
  ctx.globalAlpha = a
  const s = tam * 1.1
  ctx.drawImage(brilho(p.cor), p.x - s, p.y - s, s * 2, s * 2)
  if (p.tipo === 3) {
    // estrela: duas faixas finas cruzadas
    ctx.fillStyle = css(p.cor, a * 0.8)
    ctx.fillRect(p.x - s, p.y - 0.6, s * 2, 1.2)
    ctx.fillRect(p.x - 0.6, p.y - s, 1.2, s * 2)
  }
  ctx.globalAlpha = 1
}

export class Render2D {
  ctx: CanvasRenderingContext2D
  W = 0
  H = 0
  dpr = 1
  constructor(public canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!
  }
  redimensionar(W: number, H: number, dpr: number) {
    this.W = W
    this.H = H
    this.dpr = dpr
    this.canvas.width = Math.round(W * dpr)
    this.canvas.height = Math.round(H * dpr)
  }
  limpar() {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0)
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  desenhar(q: Quadro) {
    const { ctx, W, H } = this
    this.limpar()
    ctx.setTransform(this.dpr, 0, 0, this.dpr, q.shake[0] * this.dpr, q.shake[1] * this.dpr)
    const t = q.t

    // tempestade: céu fechando, nuvens acesas por dentro e chuva na diagonal
    if (q.tempestade) {
      const tp = q.tempestade
      ctx.globalAlpha = tp.alfa
      const g = ctx.createLinearGradient(0, 0, 0, H)
      g.addColorStop(0, 'rgba(6,10,24,.82)')
      g.addColorStop(0.6, 'rgba(6,10,24,.45)')
      g.addColorStop(1, 'rgba(6,10,24,.3)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, W, H)
      const luz = ctx.createRadialGradient(tp.luzPos.x, tp.luzPos.y, 0, tp.luzPos.x, tp.luzPos.y, H * 0.5)
      luz.addColorStop(0, `rgba(160,200,255,${0.55 * tp.luz})`)
      luz.addColorStop(1, 'rgba(30,144,255,0)')
      ctx.globalCompositeOperation = 'lighter'
      ctx.fillStyle = luz
      ctx.fillRect(0, 0, W, H * 0.7)
      ctx.strokeStyle = `rgba(170,190,225,${0.22 + 0.4 * tp.luz})`
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let i = 0; i < 46; i++) {
        const x = ((i * 97.3 + t * 260) % (W + 200)) - 100
        const y = ((i * 53.1 + t * 1200) % (H + 160)) - 80
        ctx.moveTo(x, y)
        ctx.lineTo(x - 7, y - 30)
      }
      ctx.stroke()
      if (tp.marca[3] > 0) {
        const [mx, my, idade] = tp.marca
        const a = Math.exp(-idade * 1.3)
        ctx.save()
        ctx.translate(mx, my)
        ctx.scale(1, 0.36)
        const m = ctx.createRadialGradient(0, 0, 0, 0, 0, 80)
        m.addColorStop(0, `rgba(200,230,255,${0.8 * a})`)
        m.addColorStop(0.4, `rgba(30,144,255,${0.4 * a})`)
        m.addColorStop(1, 'rgba(30,144,255,0)')
        ctx.fillStyle = m
        ctx.fillRect(-80, -80, 160, 160)
        ctx.restore()
      }
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1
    }

    // névoa da magia
    if (q.nevoa) {
      ctx.globalCompositeOperation = 'lighter'
      q.nevoa.pts.forEach(([x, y, idade], i) => {
        const r = 50 + idade * 80
        const c: RGB = i % 3 === 0 ? [0.08, 0.75, 0.78] : [0.55, 0.32, 0.98]
        const g = ctx.createRadialGradient(x, y, 0, x, y, r)
        g.addColorStop(0, css(c, 0.32 * (1 - idade)))
        g.addColorStop(1, css(c, 0))
        ctx.fillStyle = g
        ctx.fillRect(x - r, y - r, r * 2, r * 2)
      })
      ctx.globalCompositeOperation = 'source-over'
    }

    // portal: vazio estrelado, anéis girando em sentidos opostos e símbolos
    if (q.portal && q.portal.abre > 0.01) {
      const { c, r, abre } = q.portal
      const R = r * abre
      const v = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, R * 0.66)
      v.addColorStop(0, 'rgba(10,4,26,.96)')
      v.addColorStop(0.85, 'rgba(24,8,48,.92)')
      v.addColorStop(1, 'rgba(24,8,48,0)')
      ctx.fillStyle = v
      ctx.beginPath()
      ctx.arc(c.x, c.y, R * 0.66, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalCompositeOperation = 'lighter'
      const anel = (rr: number, cor: string, w: number, dash: number[], giro: number) => {
        ctx.setLineDash(dash)
        ctx.lineDashOffset = giro
        ctx.strokeStyle = cor
        ctx.lineWidth = w
        ctx.beginPath()
        ctx.arc(c.x, c.y, R * rr, 0, Math.PI * 2)
        ctx.stroke()
      }
      anel(0.64, 'rgba(40,220,230,.9)', 3, [], 0)
      anel(0.64, 'rgba(40,220,230,.25)', 12, [], 0)
      anel(0.74, 'rgba(30,210,210,.8)', 2, [R * 0.25, R * 0.12], t * 90)
      anel(0.86, 'rgba(160,100,255,.85)', 2.5, [R * 0.12, R * 0.16], -t * 70)
      anel(1.04, 'rgba(255,200,90,.85)', 1.5, [], 0)
      ctx.setLineDash([])
      // símbolos inventados na faixa entre os anéis
      ctx.strokeStyle = 'rgba(255,205,110,.9)'
      ctx.lineWidth = 1.4
      const n = 22
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + t * 0.45
        const x = c.x + Math.cos(a) * R * 0.95
        const y = c.y + Math.sin(a) * R * 0.95
        const s = R * 0.045
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(a + Math.PI / 2)
        ctx.beginPath()
        ctx.moveTo(0, -s)
        ctx.lineTo(0, s)
        if (i % 2) (ctx.moveTo(-s * 0.7, -s * 0.3), ctx.lineTo(s * 0.7, s * 0.3))
        if (i % 3 === 0) (ctx.moveTo(-s * 0.6, s), ctx.lineTo(s * 0.6, s))
        ctx.stroke()
        ctx.restore()
      }
      ctx.globalCompositeOperation = 'source-over'
    }

    // fissuras escuras
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    for (const l of q.escuras) {
      if (l.pts.length < 2) continue
      caminho(ctx, l.pts)
      ctx.lineWidth = l.larg
      ctx.strokeStyle = css(l.halo, l.alfa)
      ctx.stroke()
    }
    // pedras e fumaça (mistura normal)
    for (const p of q.sobre) particula(ctx, p)

    ctx.globalCompositeOperation = 'lighter'
    // ondas de choque
    for (const o of q.ondas) {
      if (o.forca <= 0.01 || o.r <= 1) continue
      ctx.strokeStyle = css(o.cor, 0.5 * o.forca)
      ctx.lineWidth = 6 + o.r * 0.03
      ctx.beginPath()
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2)
      ctx.stroke()
      ctx.strokeStyle = css(o.cor, 0.15 * o.forca)
      ctx.lineWidth = 22 + o.r * 0.06
      ctx.stroke()
    }
    // poço incandescente
    if (q.poco && q.poco[3] > 0) {
      const [x, y, r, calor] = q.poco
      ctx.save()
      ctx.translate(x, y)
      ctx.scale(1, 0.45)
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.6)
      g.addColorStop(0, `rgba(255,${(150 + 100 * calor) | 0},${(60 + 120 * calor) | 0},${calor})`)
      g.addColorStop(0.4, `rgba(255,90,20,${0.6 * calor})`)
      g.addColorStop(1, 'rgba(160,20,0,0)')
      ctx.fillStyle = g
      ctx.fillRect(-r * 1.6, -r * 1.6, r * 3.2, r * 3.2)
      ctx.restore()
    }
    // feixe e esfera de carga
    if (q.feixe) {
      const f = q.feixe
      if (f.carga > 0) {
        const R = 8 + f.carga * 28
        const g = ctx.createRadialGradient(f.a.x, f.a.y, 0, f.a.x, f.a.y, R * 2.4)
        g.addColorStop(0, 'rgba(255,250,235,1)')
        g.addColorStop(0.25, 'rgba(255,170,70,.85)')
        g.addColorStop(0.6, 'rgba(110,170,255,.3)')
        g.addColorStop(1, 'rgba(110,170,255,0)')
        ctx.fillStyle = g
        ctx.fillRect(f.a.x - R * 2.4, f.a.y - R * 2.4, R * 4.8, R * 4.8)
      }
      if (f.forca > 0) {
        const b = { x: f.a.x + (f.b.x - f.a.x) * f.alcance, y: f.a.y + (f.b.y - f.a.y) * f.alcance }
        const w = f.larg * (0.9 + 0.1 * Math.sin(t * 60))
        const tr = (lw: number, cor: string) => {
          ctx.lineWidth = lw
          ctx.strokeStyle = cor
          ctx.beginPath()
          ctx.moveTo(f.a.x, f.a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()
        }
        tr(w * 2.6, `rgba(80,140,255,${0.18 * f.forca})`)
        tr(w * 1.1, `rgba(255,110,20,${0.6 * f.forca})`)
        tr(w * 0.35, `rgba(255,250,235,${f.forca})`)
      }
    }
    for (const l of q.linhas) linhaLuz(ctx, l)
    for (const p of q.luz) particula(ctx, p)
    ctx.globalCompositeOperation = 'source-over'
  }
}
