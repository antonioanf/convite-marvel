/**
 * Emblema do herói: escudo original com um raio e as iniciais "JL" (desenhadas como formas,
 * então não dependem de fonte). Uma fonte só para a intro, o hero, o favicon, a credencial e a OG.
 * Função pura (sem DOM): também é usada pelo vite.config.ts e pelos scripts.
 */
import type { Paleta } from '../config/convite.ts'

/** Contorno do escudo (viewBox 0 0 100 112): topo com ponta no meio, laterais retas e base arredondada em ponta. */
export const ESCUDO = 'M50 5 C62 12 78 13 93 11 L93 52 C93 79 74 97 50 108 C26 97 7 79 7 52 L7 11 C22 13 38 12 50 5 Z'
const ESCUDO_INTERNO = 'M50 17 C60 22 72 23 83 22 L83 53 C83 73 69 87 50 96 C31 87 17 73 17 53 L17 22 C28 23 40 22 50 17 Z'
const RAIO = 'M66 18 L30 63 L47 63 L36 101 L76 47 L58 47 L74 18 Z'
const J = 'M29 35 H49 V67 C49 79 43 84 36 84 C28 84 23 79 23 70 V65 H34 V69 C34 72 35 73 36.5 73 C38 73 39 72 39 69 V46 H29 Z'
const L = 'M53 35 H64 V72 H78 V84 H53 Z'

export interface EmblemaOpts {
  /** Brilho ciano em volta (intro/hero). */
  glow?: boolean
  /** Atributos extras no <svg> (classe, tamanho...). */
  attrs?: string
  /** Título acessível; sem ele o SVG fica aria-hidden. */
  title?: string
}

export function emblemaSvg(p: Paleta, o: EmblemaOpts = {}) {
  const a11y = o.title ? `role="img" aria-label="${o.title}"` : 'aria-hidden="true" focusable="false"'
  const vb = o.glow ? '-12 -10 124 132' : '0 0 100 112'
  const glow = o.glow
    ? `<path d="${ESCUDO}" fill="none" stroke="${p.ciano}" stroke-width="16" stroke-linejoin="round" opacity=".28"/>`
    : ''
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" ${a11y} ${o.attrs ?? ''}>` +
    glow +
    // sombra deslocada (estilo HQ)
    `<path d="${ESCUDO}" transform="translate(4 5)" fill="${p.marinho}"/>` +
    `<path d="${ESCUDO}" fill="${p.vermelho}" stroke="${p.marinho}" stroke-width="5" stroke-linejoin="round"/>` +
    `<path d="${ESCUDO_INTERNO}" fill="${p.amarelo}" stroke="${p.marinho}" stroke-width="3" stroke-linejoin="round"/>` +
    `<path d="${RAIO}" fill="${p.azul}" stroke="${p.marinho}" stroke-width="2.5" stroke-linejoin="round"/>` +
    `<g fill="${p.branco}" stroke="${p.marinho}" stroke-width="3.2" stroke-linejoin="round" paint-order="stroke">` +
    `<path d="${J}"/><path d="${L}"/></g>` +
    // reflexo
    `<path d="M15 16 C25 18 36 17 46 12" fill="none" stroke="${p.branco}" stroke-width="3" stroke-linecap="round" opacity=".55"/>` +
    `</svg>`
  )
}

export const emblemaDataUri = (p: Paleta) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(emblemaSvg(p))}`
