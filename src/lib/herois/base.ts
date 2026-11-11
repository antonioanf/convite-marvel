/**
 * Peças comuns dos heróis chibi (cabeça grande, olhos grandes e brilhantes, corpinho pequeno).
 * Tudo gera texto SVG (funções puras, sem DOM): o mesmo desenho serve para a intro (embutida no
 * index.html pelo vite.config), para os componentes React e para o PNG da carteirinha.
 *
 * Sistema de coordenadas de todos os heróis: viewBox "-30 -20 260 290", herói centrado em x = 100,
 * cabeça em (100, 84) com raio 56, pés em y ≈ 248, sombra em y = 254.
 * Classes para animar (CSS): h-flutua, h-respira, h-olhos, h-capa, h-chama, h-faisca, h-brilho.
 */
export type Pose = 'normal' | 'ataque'

export interface Tinta {
  /** contorno (azul-marinho) */
  O: string
}

/** Atributos de contorno suave. */
export const sk = (O: string, w = 3.5) => `stroke="${O}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`

/** Forma fechada com contorno. */
export const forma = (d: string, fill: string, O: string, w = 3.5, extra = '') => `<path d="${d}" fill="${fill}" ${sk(O, w)} ${extra}/>`

/** Braço/perna em "tubo": um traço grosso de contorno e o traço colorido por cima. */
export function membro(d: string, cor: string, O: string, w = 15) {
  return (
    `<path d="${d}" fill="none" stroke="${O}" stroke-width="${w + 7}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="none" stroke="${cor}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`
  )
}

/** Mão (bolinha) com contorno. */
export const mao = (x: number, y: number, cor: string, O: string, r = 10) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${cor}" ${sk(O)}/>`

/** Sombra no chão (fica fora do grupo que flutua). */
export const sombra = (O: string, rx = 46) => `<ellipse class="h-sombra" cx="100" cy="254" rx="${rx}" ry="7" fill="${O}" opacity=".16"/>`

export const orelhas = (pele: string, O: string) =>
  `<circle cx="45" cy="96" r="10" fill="${pele}" ${sk(O)}/><circle cx="155" cy="96" r="10" fill="${pele}" ${sk(O)}/>`

/** Cabeça grande + brilho suave na testa. */
export const cabeca = (pele: string, O: string) =>
  `<circle cx="100" cy="84" r="56" fill="${pele}" ${sk(O)}/>` + `<ellipse cx="82" cy="58" rx="16" ry="8" fill="#fff" opacity=".18" transform="rotate(-20 82 58)"/>`

/** Olhos grandes e brilhantes. `mascara` = cor da máscara em volta dos olhos (com o branco aparecendo). */
export function olhos(O: string, iris: string, o: { mascara?: string } = {}) {
  let s = ''
  if (o.mascara) {
    s += `<path d="M54 96 Q55 74 79 77 Q93 78 100 86 Q107 78 121 77 Q145 74 146 96 Q145 116 122 116 Q107 116 100 107 Q93 116 78 116 Q55 116 54 96 Z" fill="${o.mascara}" ${sk(O, 3)}/>`
  }
  s += '<g class="h-olhos">'
  for (const x of [80, 120]) {
    if (o.mascara) s += `<ellipse cx="${x}" cy="96" rx="13.5" ry="15" fill="#fff"/>`
    s += `<ellipse cx="${x}" cy="97" rx="10.5" ry="13" fill="${iris}" stroke="${O}" stroke-width="2.4"/>`
    s += `<ellipse cx="${x}" cy="94.6" rx="7.4" ry="9.4" fill="${O}"/>`
    s += `<circle cx="${x - 3.6}" cy="90" r="4.3" fill="#fff"/><circle cx="${x + 3.8}" cy="101.6" r="2" fill="#fff"/>`
  }
  return s + '</g>'
}

/** Sobrancelhas: normal (arco feliz) ou ataque (decididas). */
export function sobrancelhas(O: string, pose: Pose, y = 74, cor = O) {
  const d =
    pose === 'ataque'
      ? `M68 ${y - 3} Q80 ${y - 1} 91 ${y + 5} M109 ${y + 5} Q120 ${y - 1} 132 ${y - 3}`
      : `M69 ${y + 1} Q80 ${y - 5} 91 ${y} M109 ${y} Q120 ${y - 5} 131 ${y + 1}`
  return `<path d="${d}" fill="none" stroke="${cor}" stroke-width="3.6" stroke-linecap="round"/>`
}

/** Boca: sorriso fechado, sorriso aberto ou grito de ataque. */
export function boca(O: string, tipo: 'sorriso' | 'aberto' | 'grito') {
  if (tipo === 'sorriso') return `<path d="M90 117 Q100 127 110 117" fill="none" stroke="${O}" stroke-width="3.4" stroke-linecap="round"/>`
  if (tipo === 'aberto')
    return (
      `<path d="M88 114 Q100 132 112 114 Q100 118 88 114 Z" fill="#8A2335" ${sk(O, 3)}/>` +
      `<path d="M94 122 Q100 128 106 122 Q100 124 94 122 Z" fill="#F58FA0"/>`
    )
  return (
    `<path d="M89 113 Q100 108 111 113 Q113 130 100 132 Q87 130 89 113 Z" fill="#8A2335" ${sk(O, 3)}/>` +
    `<path d="M93 126 Q100 121 107 126 Q100 131 93 126 Z" fill="#F58FA0"/>` +
    `<path d="M92 113.5 Q100 111 108 113.5 L107 116 Q100 114 93 116 Z" fill="#fff"/>`
  )
}

export const bochechas = (cor = '#FF8FA3') =>
  `<ellipse cx="64" cy="113" rx="8" ry="4.6" fill="${cor}" opacity=".55"/><ellipse cx="136" cy="113" rx="8" ry="4.6" fill="${cor}" opacity=".55"/>`

/** Brilhinho de estrela de 4 pontas (olhos, efeitos). */
export const estrela = (x: number, y: number, r: number, cor: string, extra = '') =>
  `<path d="M${x} ${y - r} Q${x + r * 0.18} ${y - r * 0.18} ${x + r} ${y} Q${x + r * 0.18} ${y + r * 0.18} ${x} ${y + r} Q${x - r * 0.18} ${y + r * 0.18} ${x - r} ${y} Q${x - r * 0.18} ${y - r * 0.18} ${x} ${y - r} Z" fill="${cor}" ${extra}/>`

/** Tronco arredondado (largura configurável para o Tremor). */
export function tronco(cor: string, O: string, l = 28, topo = 132, base = 206) {
  const x0 = 100 - l
  const x1 = 100 + l
  return forma(`M${x0} ${topo + 18} Q${x0} ${topo} 100 ${topo} Q${x1} ${topo} ${x1} ${topo + 18} L${x1 + 2} ${base - 10} Q${x1 + 2} ${base} ${x1 - 8} ${base} L${x0 + 6} ${base} Q${x0 - 2} ${base} ${x0 - 2} ${base - 10} Z`, cor, O)
}

/** Pernas curtinhas + botas. */
export function pernas(
  calca: string,
  bota: string,
  O: string,
  o: { abertas?: boolean; largura?: number; detalhe?: (xl: number, xr: number, w: number) => string } = {},
) {
  const w = o.largura ?? 17
  const dx = o.abertas ? 6 : 0
  const xl = 100 - 2 - w - dx
  const xr = 100 + 2 + dx
  let s =
    `<rect x="${xl}" y="196" width="${w}" height="40" rx="7" fill="${calca}" ${sk(O)}/>` +
    `<rect x="${xr}" y="196" width="${w}" height="40" rx="7" fill="${calca}" ${sk(O)}/>`
  // botas arredondadas, bico para fora
  s += forma(`M${xl - 6} 244 Q${xl - 6} 226 ${xl + w / 2} 226 Q${xl + w + 2} 226 ${xl + w + 2} 236 L${xl + w + 2} 248 L${xl - 6} 248 Z`, bota, O)
  s += forma(`M${xr + w + 6} 244 Q${xr + w + 6} 226 ${xr + w / 2} 226 Q${xr - 2} 226 ${xr - 2} 236 L${xr - 2} 248 L${xr + w + 6} 248 Z`, bota, O)
  if (o.detalhe) s += o.detalhe(xl, xr, w)
  return s
}

/** Envelope final de um herói. */
export function svgHeroi(id: string, pose: Pose, O: string, corpo: string, o: { attrs?: string; title?: string; sombraRx?: number; flutua?: boolean } = {}) {
  const a11y = o.title ? `role="img" aria-label="${o.title}"` : 'aria-hidden="true" focusable="false"'
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-30 -20 260 290" overflow="visible" class="heroi heroi-${id} pose-${pose}${o.flutua ? ' voa' : ''}" ${a11y} ${o.attrs ?? ''}>` +
    sombra(O, o.sombraRx) +
    `<g class="h-flutua"><g class="h-respira">${corpo}</g></g>` +
    `</svg>`
  )
}
