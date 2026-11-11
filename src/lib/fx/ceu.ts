/**
 * Céu do pôster (pintado UMA vez, em baixa resolução, esticado pelo CSS): tempestade dramática com
 * uma explosão de luz atravessando as nuvens no centro-alto. As nuvens ficam escuras por dentro e
 * acesas nas bordas viradas para a luz — dourado e laranja perto da explosão, azul elétrico longe
 * dela. Embaixo, o céu escurece até o quase preto azulado do convite (#05070D).
 * A pintura roda num Worker (ceu.worker.ts) para não travar a abertura. Função pura: devolve RGBA.
 */

type C3 = [number, number, number]

function hash(x: number, y: number, s: number) {
  let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

function ruido(x: number, y: number, s: number) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  const a = hash(xi, yi, s)
  const b = hash(xi + 1, yi, s)
  const c = hash(xi, yi + 1, s)
  const d = hash(xi + 1, yi + 1, s)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

function fbm(x: number, y: number, s: number, oit = 5) {
  let v = 0
  let a = 0.5
  for (let i = 0; i < oit; i++) {
    v += a * ruido(x, y, s + i * 17)
    x = x * 2.03 + 1.7
    y = y * 2.03 + 9.2
    a *= 0.5
  }
  return v
}

const ss = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
const mix3 = (a: C3, b: C3, k: number): C3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]

const ESCURO: C3 = [5, 7, 13] // #05070D
const CEU_LONGE: C3 = [12, 16, 40] // azul de tempestade
const CEU_ROXO: C3 = [34, 18, 62] // rasgos roxos nas laterais
const NUVEM: C3 = [14, 15, 30] // corpo da nuvem na sombra
const OURO: C3 = [255, 196, 96]
const LARANJA: C3 = [255, 110, 30]
const AZUL: C3 = [40, 120, 255]
const BRANCO: C3 = [255, 246, 226]

/** `fy` = altura da explosão de luz (0 = topo, 1 = base) */
export function pintarCeu(w: number, h: number, seed = 7, fy = 0.28): Uint8ClampedArray {
  const px = new Uint8ClampedArray(w * h * 4)
  const sx = w / 2
  const sy = h * fy
  const asp = w / h
  for (let j = 0; j < h; j++) {
    const v = j / (h - 1)
    for (let i = 0; i < w; i++) {
      const u = i / (w - 1)
      let dx = sx - i
      let dy = sy - j
      const dist = Math.hypot(dx, dy) || 1
      const dn = dist / h // distância normalizada à explosão
      dx /= dist
      dy /= dist
      // céu entre as nuvens: azul de tempestade, roxo nas laterais, brilho quente perto da luz
      const lateral = ss(0.25, 0.5, Math.abs(u - 0.5))
      let ceu = mix3(CEU_LONGE, CEU_ROXO, lateral * 0.7)
      const brilho = Math.exp(-dn / 0.2)
      ceu = mix3(ceu, OURO, brilho * 0.85)
      ceu = mix3(ceu, BRANCO, Math.exp(-dn / 0.06) * 0.9)

      // nuvens de tempestade (esticadas na horizontal), com a amostra deslocada para a luz:
      // se lá é menos denso, este ponto é a borda acesa
      const qx = u * 2.6 * asp * 1.7
      const qy = v * 4.8
      const wx = fbm(qx * 0.9 + 3.1, qy * 0.9, seed + 3, 3)
      const wy = fbm(qx * 0.9 - 2.4, qy * 0.9 + 5.2, seed + 5, 3)
      const d = fbm(qx + wx * 1.1, qy + wy * 0.8, seed)
      const d2 = fbm(qx + wx * 1.1 + dx * 0.18 * asp, qy + wy * 0.8 + dy * 0.34, seed)
      const aceso = Math.min(1, Math.max(0, (d - d2) * 7 + 0.05))
      // as nuvens abrem em volta da explosão (o buraco por onde a luz passa)
      const buraco = ss(0.05, 0.22, dn)
      const dens = ss(0.42, 0.66, d) * buraco
      // borda acesa: dourado/laranja perto da luz, azul elétrico longe dela
      const perto = Math.exp(-dn / 0.32)
      const cor = mix3(AZUL, mix3(LARANJA, OURO, ss(0.4, 0.85, perto)), ss(0.15, 0.55, perto))
      const forca = aceso * (0.18 + perto * 0.95)
      const franja = (ss(0.38, 0.45, d) - ss(0.45, 0.56, d)) * buraco * (0.15 + perto * 0.8)
      let r = ceu[0] + (NUVEM[0] + cor[0] * forca - ceu[0]) * dens + cor[0] * franja * 0.55
      let g = ceu[1] + (NUVEM[1] + cor[1] * forca - ceu[1]) * dens + cor[1] * franja * 0.55
      let b = ceu[2] + (NUVEM[2] + cor[2] * forca - ceu[2]) * dens + cor[2] * franja * 0.55
      // embaixo: escurece até o fundo do convite
      const desce = ss(0.55, 0.95, v)
      r += (ESCURO[0] - r) * desce
      g += (ESCURO[1] - g) * desce
      b += (ESCURO[2] - b) * desce
      const o = (j * w + i) * 4
      px[o] = r
      px[o + 1] = g
      px[o + 2] = b
      px[o + 3] = 255
    }
  }
  return px
}
