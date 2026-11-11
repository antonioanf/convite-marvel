/**
 * Raios fractais (deslocamento do ponto médio + galhos que se ramificam).
 * Cada chamada gera um raio diferente. Usado pela intro (2D), pela Tempestade (WebGL) e pelo fallback 2D.
 */
export interface Pt {
  x: number
  y: number
}
export interface Galho {
  pts: Pt[]
  /** espessura relativa (tronco = 1) */
  w: number
  /** quando o galho some (s), relativo ao início do raio */
  vida: number
}
export interface Raio {
  galhos: Galho[]
  /** ponto onde o raio toca (fim do tronco) */
  fim: Pt
}

/** Linha com desvios fractais entre a e b. */
function fractal(a: Pt, b: Pt, niveis: number, desvio: number, rnd: () => number): Pt[] {
  let pts = [a, b]
  let d = Math.hypot(b.x - a.x, b.y - a.y) * desvio
  for (let n = 0; n < niveis; n++) {
    const novo: Pt[] = [pts[0]]
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i - 1]
      const q = pts[i]
      const dx = q.x - p.x
      const dy = q.y - p.y
      const len = Math.hypot(dx, dy) || 1
      const off = (rnd() * 2 - 1) * d
      novo.push({ x: (p.x + q.x) / 2 + (-dy / len) * off, y: (p.y + q.y) / 2 + (dx / len) * off })
      novo.push(q)
    }
    pts = novo
    d *= 0.52
  }
  return pts
}

export function gerarRaio(a: Pt, b: Pt, o: { niveis?: number; desvio?: number; galhos?: number; rnd?: () => number } = {}): Raio {
  const rnd = o.rnd ?? Math.random
  const tronco = fractal(a, b, o.niveis ?? 7, o.desvio ?? 0.2, rnd)
  const total = Math.hypot(b.x - a.x, b.y - a.y)
  const galhos: Galho[] = [{ pts: tronco, w: 1, vida: 1 }]
  const nGalhos = Math.round((o.galhos ?? 1) * (3 + rnd() * 4))
  for (let k = 0; k < nGalhos; k++) {
    const i = Math.floor(tronco.length * (0.12 + rnd() * 0.66))
    const p = tronco[i]
    const q = tronco[Math.min(tronco.length - 1, i + 3)]
    const ang = Math.atan2(q.y - p.y, q.x - p.x) + (rnd() < 0.5 ? -1 : 1) * (0.35 + rnd() * 0.6)
    const len = total * (0.12 + rnd() * 0.28)
    const fim = { x: p.x + Math.cos(ang) * len, y: p.y + Math.sin(ang) * len }
    const pts = fractal(p, fim, 5, 0.26, rnd)
    galhos.push({ pts, w: 0.5 + rnd() * 0.2, vida: 0.32 + rnd() * 0.2 })
    // sub-galho
    if (rnd() < 0.55) {
      const j = Math.floor(pts.length * (0.3 + rnd() * 0.4))
      const p2 = pts[j]
      const ang2 = ang + (rnd() < 0.5 ? -1 : 1) * (0.3 + rnd() * 0.5)
      const len2 = len * (0.3 + rnd() * 0.35)
      galhos.push({ pts: fractal(p2, { x: p2.x + Math.cos(ang2) * len2, y: p2.y + Math.sin(ang2) * len2 }, 4, 0.3, rnd), w: 0.28, vida: 0.22 + rnd() * 0.12 })
    }
  }
  return { galhos, fim: tronco[tronco.length - 1] }
}

/**
 * Brilho do raio ao longo do tempo (s): acende, pisca uma vez (como raio de verdade, que "re-golpeia")
 * e apaga. Galhos somem antes (~150 ms).
 */
export function envelope(t: number, vida = 1) {
  const fimGalho = 0.15 * vida
  if (t < 0) return 0
  if (vida < 1 && t > fimGalho) return Math.max(0, 1 - (t - fimGalho) / 0.06)
  if (t < 0.03) return t / 0.03
  if (t < 0.09) return 1
  if (t < 0.13) return 0.35
  if (t < 0.19) return 1
  return Math.max(0, 1 - (t - 0.19) / 0.28)
}

/** Desenha um raio em canvas 2D com brilho em camadas (sem shadowBlur, que é caro). */
export function desenharRaio2D(ctx: CanvasRenderingContext2D, r: Raio, t: number, largura = 3, cor: [number, number, number] = [150, 200, 255]) {
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  const [cr, cg, cb] = cor
  for (const g of r.galhos) {
    const a = envelope(t, g.vida)
    if (a <= 0.01) continue
    const w = largura * g.w
    ctx.beginPath()
    ctx.moveTo(g.pts[0].x, g.pts[0].y)
    for (let i = 1; i < g.pts.length; i++) ctx.lineTo(g.pts[i].x, g.pts[i].y)
    // halo largo (bloom), brilho médio, borda azulada e núcleo quase branco
    const camadas: [number, number, string][] = [
      [w * 22, 0.035, `${cr * 0.4},${cg * 0.6},255`],
      [w * 11, 0.08, `${cr * 0.5},${cg * 0.7},255`],
      [w * 5, 0.2, `${cr},${cg},255`],
      [w * 2.4, 0.6, `${Math.min(255, cr + 50)},${Math.min(255, cg + 35)},255`],
      [w * 1.1, 1, '244,250,255'],
    ]
    for (const [lw, al, c] of camadas) {
      ctx.lineWidth = lw
      ctx.strokeStyle = `rgba(${c},${(al * a).toFixed(3)})`
      ctx.stroke()
    }
  }
  // brilho no ponto onde o raio toca
  const a = envelope(t)
  if (a > 0.01) {
    const g = ctx.createRadialGradient(r.fim.x, r.fim.y, 0, r.fim.x, r.fim.y, largura * 26)
    g.addColorStop(0, `rgba(220,238,255,${0.7 * a})`)
    g.addColorStop(0.3, `rgba(120,180,255,${0.25 * a})`)
    g.addColorStop(1, 'rgba(60,120,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(r.fim.x - largura * 26, r.fim.y - largura * 26, largura * 52, largura * 52)
  }
  ctx.restore()
}
