/**
 * Textura da asa (direita) desenhada por código em canvas — visual metalizado/holográfico,
 * como os balões de borboleta das fotos.
 * A mesma imagem é usada pelo renderizador 3D (CanvasTexture) e pelo 2D (drawImage),
 * então as borboletas ficam idênticas nos dois modos.
 */
import { convite } from '../config/convite'
import { FOREWING, HINDWING } from './butterflySvg'

/** Tamanho do canvas e mapeamento "unidades da asa" → px do canvas (2x para ficar nítido). */
export const WING = { W: 320, H: 512, S: 5.2, OX: 8, OY: 256 }
/** Envergadura total da borboleta em unidades da asa (2 asas). */
export const WINGSPAN_UNITS = 104
export const VARIANTS = 3

const cache = new Map<number, HTMLCanvasElement>()

function variantColors(v: number) {
  const p = convite.paleta
  switch (v % VARIANTS) {
    case 0: // lilás
      return { base: p.roxo, mid: p.violeta, edge: p.lilas, line: p.roxo }
    case 1: // violeta profundo
      return { base: p.roxo, mid: '#6d3fd9', edge: p.violeta, line: p.roxo }
    default: // rosa / magenta
      return { base: '#9e2a68', mid: p.magenta, edge: p.rosa, line: '#5c1640' }
  }
}

export function wingCanvas(variant: number): HTMLCanvasElement {
  const key = variant % VARIANTS
  const hit = cache.get(key)
  if (hit) return hit
  const { W, H, S, OX, OY } = WING
  const p = convite.paleta
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')!
  const col = variantColors(key)
  g.setTransform(S, 0, 0, S, OX, OY)

  const fore = new Path2D(FOREWING)
  const hind = new Path2D(HINDWING)

  const paint = (path: Path2D, cy: number, r: number) => {
    g.save()
    g.clip(path)
    // base metalizada: do corpo (escuro) para a ponta (claro)
    const rg = g.createRadialGradient(2, cy * 0.1, 0, 2, cy * 0.1, r * 1.2)
    rg.addColorStop(0, col.base)
    rg.addColorStop(0.5, col.mid)
    rg.addColorStop(1, col.edge)
    g.fillStyle = rg
    g.fillRect(-10, -60, 80, 120)
    // faixas holográficas (ciano/rosa/prata) em diagonal
    g.globalCompositeOperation = 'screen'
    const holo = g.createLinearGradient(0, cy < 0 ? -48 : 44, 52, cy < 0 ? 4 : -4)
    holo.addColorStop(0, 'rgba(0,0,0,0)')
    holo.addColorStop(0.3, hexA(p.holoCiano, 0.38))
    holo.addColorStop(0.45, hexA(p.prata, 0.45))
    holo.addColorStop(0.6, hexA(p.holoRosa, 0.38))
    holo.addColorStop(0.8, 'rgba(0,0,0,0)')
    g.fillStyle = holo
    g.fillRect(-10, -60, 80, 120)
    g.globalCompositeOperation = 'source-over'
    // veias prateadas
    g.strokeStyle = 'rgba(255,255,255,.55)'
    g.lineWidth = 0.55
    for (let i = 0; i < 6; i++) {
      const a = (cy < 0 ? -1 : 1) * (0.15 + i * 0.22)
      g.beginPath()
      g.moveTo(2, cy < 0 ? -3 : 2)
      g.quadraticCurveTo(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5, Math.cos(a) * r * 1.2, Math.sin(a) * r * 1.2)
      g.stroke()
    }
    // borda: linha fina escura por dentro + brilho claro
    g.lineWidth = 2.6
    g.strokeStyle = hexA(col.line, 0.85)
    g.stroke(path)
    g.lineWidth = 0.7
    g.strokeStyle = 'rgba(255,255,255,.45)'
    g.stroke(path)
    g.restore()
  }

  paint(fore, -30, 52)
  paint(hind, 26, 38)

  // manchas brancas perolizadas
  const spot = (x: number, y: number, r: number, a = 1) => {
    g.globalAlpha = a
    g.fillStyle = '#fff'
    g.beginPath()
    g.arc(x, y, r, 0, Math.PI * 2)
    g.fill()
    g.globalAlpha = 1
  }
  spot(38, -27, 3.6, 0.92)
  spot(45, -17, 1.6, 0.8)
  spot(28, -18, 1.4, 0.7)
  spot(27, 25, 3, 0.8)
  spot(34, 33, 1.3, 0.7)

  // reflexo especular (o "metal" do balão)
  g.save()
  g.clip(fore)
  const sheen = g.createLinearGradient(6, -40, 40, -6)
  sheen.addColorStop(0, 'rgba(255,255,255,0)')
  sheen.addColorStop(0.45, 'rgba(255,255,255,.4)')
  sheen.addColorStop(0.55, 'rgba(255,255,255,.1)')
  sheen.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = sheen
  g.fillRect(0, -50, 60, 60)
  g.restore()

  cache.set(key, c)
  return c
}

function hexA(hex: string, a: number) {
  const n = parseInt(hex.replace('#', ''), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}
