/**
 * Silhueta de cidade (prédios) gerada por código: duas fileiras, com janelinhas acesas.
 * Cada `seed` dá uma cidade diferente. Função pura (texto SVG): usada pela intro (via vite.config)
 * e pelos componentes do convite.
 */
import { seeded } from './burst.ts'

export interface CidadeCores {
  fundo: string
  frente: string
  contorno: string
  janela: string
}

export function cidadeSvg(c: CidadeCores, o: { seed?: number; attrs?: string; contorno?: boolean } = {}) {
  const rnd = seeded((o.seed ?? 1) * 97 + 13)
  const W = 400
  const H = 100
  let s = ''
  // fileira de trás
  for (let x = -6; x < W; ) {
    const w = 22 + rnd() * 34
    const h = 40 + rnd() * 52
    s += `<rect x="${x.toFixed(1)}" y="${(H - h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${c.fundo}"/>`
    if (rnd() < 0.35) s += `<rect x="${(x + w / 2 - 1).toFixed(1)}" y="${(H - h - 10).toFixed(1)}" width="2.4" height="10" fill="${c.fundo}"/>`
    x += w - 2
  }
  // fileira da frente com janelas
  const stroke = o.contorno === false ? '' : ` stroke="${c.contorno}" stroke-width="2.5"`
  for (let x = -4; x < W; ) {
    const w = 26 + rnd() * 30
    const h = 26 + rnd() * 40
    const y = H - h
    s += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${(h + 4).toFixed(1)}" fill="${c.frente}"${stroke}/>`
    for (let wy = y + 7; wy < H - 8; wy += 10) {
      for (let wx = x + 6; wx < x + w - 8; wx += 9) {
        if (rnd() < 0.42) s += `<rect x="${wx.toFixed(1)}" y="${wy.toFixed(1)}" width="4.5" height="5" rx="1" fill="${c.janela}"/>`
      }
    }
    x += w + (rnd() < 0.3 ? 4 : -1)
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 100" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false" ${o.attrs ?? ''}>${s}</svg>`
}
