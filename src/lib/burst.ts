/**
 * Explosões estreladas de HQ ("POW!", "BAM!", "5 ANOS!"), geradas por código.
 * Funções puras (sem DOM): usadas pela intro (via vite.config), pelos componentes e pelas onomatopeias.
 */

/** Gerador pseudoaleatório com semente (a mesma semente sempre dá a mesma explosão). */
export function seeded(seed: number) {
  let s = seed >>> 0 || 1
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

/**
 * Pontas da estrela num viewBox centrado em (0,0).
 * `rx/ry` = raio externo; as pontas variam um pouco de tamanho para parecer desenhado à mão.
 */
export function burstPoints({ spikes = 14, rx = 100, ry = 70, inner = 0.68, seed = 7 } = {}) {
  const rnd = seeded(seed)
  const pts: string[] = []
  for (let i = 0; i < spikes * 2; i++) {
    const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2 + (rnd() - 0.5) * 0.08
    const k = i % 2 === 0 ? 0.88 + rnd() * 0.24 : inner * (0.92 + rnd() * 0.14)
    pts.push(`${(Math.cos(a) * rx * k).toFixed(1)},${(Math.sin(a) * ry * k).toFixed(1)}`)
  }
  return pts.join(' ')
}

export interface BurstSvgOpts {
  text: string
  fill?: string
  stroke?: string
  textFill?: string
  /** proporção largura/altura da estrela */
  w?: number
  h?: number
  seed?: number
  spikes?: number
  fontSize?: number
  attrs?: string
}

/** SVG completo: estrela com contorno + sombra deslocada + texto em Bangers inclinado. */
export function burstSvg(o: BurstSvgOpts) {
  const w = o.w ?? 220
  const h = o.h ?? 150
  const stroke = o.stroke ?? '#0B1F4D'
  const pts = burstPoints({ rx: w / 2 - 6, ry: h / 2 - 6, seed: o.seed ?? 3, spikes: o.spikes ?? 13 })
  const fs = o.fontSize ?? Math.min(h * 0.36, (w * 1.5) / Math.max(3, o.text.length))
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-w / 2} ${-h / 2} ${w} ${h}" aria-hidden="true" focusable="false" ${o.attrs ?? ''}>` +
    `<polygon points="${pts}" transform="translate(5 6)" fill="${stroke}"/>` +
    `<polygon points="${pts}" fill="${o.fill ?? '#FFD60A'}" stroke="${stroke}" stroke-width="5" stroke-linejoin="round"/>` +
    `<text x="0" y="${(fs * 0.36).toFixed(1)}" text-anchor="middle" transform="rotate(-7)" font-family="Bangers, Impact, sans-serif" font-size="${fs.toFixed(1)}" ` +
    `letter-spacing="1.5" fill="${o.textFill ?? '#E63946'}" stroke="${stroke}" stroke-width="${(fs * 0.09).toFixed(1)}" stroke-linejoin="round" paint-order="stroke">${o.text}</text>` +
    `</svg>`
  )
}
