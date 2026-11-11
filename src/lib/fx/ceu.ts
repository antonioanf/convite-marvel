/**
 * Céu de entardecer épico, pintado UMA vez (imagem parada, em baixa resolução, esticada pelo CSS):
 * nuvens de tempestade iluminadas por baixo pelo sol baixo (laranja, vermelho e dourado), com rasgos
 * de céu azul e roxo no alto. A pintura roda num Worker (ceu.worker.ts) para não travar a abertura.
 * Função pura: recebe largura/altura e devolve os pixels RGBA.
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

function rampa(stops: [number, C3][], v: number): C3 {
  if (v <= stops[0][0]) return stops[0][1]
  for (let i = 1; i < stops.length; i++) {
    const [p1, c1] = stops[i]
    if (v <= p1) {
      const [p0, c0] = stops[i - 1]
      const k = (v - p0) / (p1 - p0)
      return [c0[0] + (c1[0] - c0[0]) * k, c0[1] + (c1[1] - c0[1]) * k, c0[2] + (c1[2] - c0[2]) * k]
    }
  }
  return stops[stops.length - 1][1]
}

// céu limpo: azul-noite no alto → roxo → vinho → brasa → dourado no horizonte
const CEU: [number, C3][] = [
  [0, [12, 14, 52]],
  [0.16, [26, 18, 80]],
  [0.32, [52, 20, 88]],
  [0.46, [78, 20, 64]],
  [0.6, [104, 24, 40]],
  [0.74, [146, 44, 22]],
  [0.86, [214, 100, 26]],
  [0.94, [246, 168, 52]],
  [1, [255, 214, 128]],
]
// luz do sol batendo por baixo das nuvens, conforme a altura
const LUZ: [number, C3][] = [
  [0, [190, 50, 110]],
  [0.3, [230, 40, 50]],
  [0.5, [255, 90, 20]],
  [0.7, [255, 150, 40]],
  [0.86, [255, 200, 100]],
  [1, [255, 230, 160]],
]
// corpo da nuvem (lado na sombra)
const BASE: [number, C3][] = [
  [0, [18, 16, 50]],
  [0.4, [36, 14, 44]],
  [0.75, [62, 20, 30]],
  [1, [90, 34, 26]],
]

export function pintarCeu(w: number, h: number, seed = 7): Uint8ClampedArray {
  const px = new Uint8ClampedArray(w * h * 4)
  const sx = w / 2
  const sy = h * 0.97 // o sol, baixo, atrás dos prédios
  const asp = w / h
  for (let j = 0; j < h; j++) {
    const v = j / (h - 1)
    const ceu = rampa(CEU, v)
    const luz = rampa(LUZ, v)
    const base = rampa(BASE, v)
    for (let i = 0; i < w; i++) {
      const u = i / (w - 1)
      // coordenadas das nuvens: esticadas na horizontal (nuvens de tempestade largas)
      const qx = u * 2.8 * asp * 1.6
      const qy = v * 5.4
      const wx = fbm(qx * 0.9 + 3.1, qy * 0.9, seed + 3, 3)
      const wy = fbm(qx * 0.9 - 2.4, qy * 0.9 + 5.2, seed + 5, 3)
      const d = fbm(qx + wx * 1.1, qy + wy * 0.8, seed)
      // amostra deslocada em direção ao sol: se lá é menos denso, este ponto é a borda acesa
      let dx = sx - i
      let dy = sy - j
      const dist = Math.hypot(dx, dy) || 1
      dx /= dist
      dy /= dist
      const passo = 0.07
      const d2 = fbm(qx + wx * 1.1 + dx * passo * 2.8 * asp, qy + wy * 0.8 + dy * passo * 5.4, seed)
      const aceso = Math.min(1, Math.max(0, (d - d2) * 7 + 0.08))
      const perto = Math.exp(-dist / (h * 0.42)) // perto do sol = luz mais forte
      // cobertura: céu fechado no meio, abrindo perto do horizonte (o brilho do sol aparece)
      const cobre = (1 - ss(0.66, 0.9, v)) * (0.75 + 0.25 * ss(0, 0.2, v))
      const dens = ss(0.44, 0.7, d) * cobre
      // rasgos azuis e roxos no alto (onde a nuvem abre)
      const rasgo = ss(0.5, 0.72, fbm(qx * 0.45 + 11, qy * 0.6, seed + 9, 3)) * (1 - ss(0.12, 0.5, v))
      const azul: C3 = v < 0.25 ? [24, 70, 170] : [80, 44, 168]
      const cr = ceu[0] + (azul[0] - ceu[0]) * rasgo * 0.75
      const cg = ceu[1] + (azul[1] - ceu[1]) * rasgo * 0.75
      const cb = ceu[2] + (azul[2] - ceu[2]) * rasgo * 0.75
      // cor da nuvem: sombra + luz por baixo + franja brilhante na borda
      // a luz forte fica na borda de baixo das nuvens e perto do horizonte; o meio da tela fica
      // escuro o bastante para o texto (as cores aparecem como brilho, não como fundo chapado)
      const k = (aceso * 0.95 + 0.06) * (0.2 + perto * 0.95)
      const nr = base[0] + luz[0] * k
      const ng = base[1] + luz[1] * k
      const nb = base[2] + luz[2] * k
      const franja = (ss(0.4, 0.47, d) - ss(0.47, 0.58, d)) * cobre * (0.25 + perto) * 0.55
      const o = (j * w + i) * 4
      px[o] = cr + (nr - cr) * dens + luz[0] * franja
      px[o + 1] = cg + (ng - cg) * dens + luz[1] * franja
      px[o + 2] = cb + (nb - cb) * dens + luz[2] * franja
      px[o + 3] = 255
    }
  }
  return px
}
