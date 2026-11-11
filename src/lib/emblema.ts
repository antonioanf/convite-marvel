/**
 * Emblema JL em metal: escudo de aço escovado com chanfro, as iniciais "JL" em relevo e um raio
 * incrustado como um veio de energia elétrica. As letras são formas (não dependem de fonte).
 * Função pura (texto SVG): usada pela intro (via vite.config), favicon, hero, credencial e OG.
 * `id` evita colisão de gradientes quando há mais de um emblema na página.
 */
import type { Paleta } from '../config/convite.ts'

/** Contorno do escudo (viewBox 0 0 100 112). */
export const ESCUDO = 'M50 5 C62 12 78 13 93 11 L93 52 C93 79 74 97 50 108 C26 97 7 79 7 52 L7 11 C22 13 38 12 50 5 Z'
const ESCUDO_INTERNO = 'M50 15 C60 21 72 22 84 21 L84 53 C84 74 69 88 50 97 C31 88 16 74 16 53 L16 21 C28 22 40 21 50 15 Z'
const RAIO = 'M66 18 L30 63 L47 63 L36 101 L76 47 L58 47 L74 18 Z'
const J = 'M29 35 H49 V67 C49 79 43 84 36 84 C28 84 23 79 23 70 V65 H34 V69 C34 72 35 73 36.5 73 C38 73 39 72 39 69 V46 H29 Z'
const L = 'M53 35 H64 V72 H78 V84 H53 Z'

export interface EmblemaOpts {
  attrs?: string
  title?: string
  /** prefixo único dos ids dos gradientes */
  id?: string
  /** 'brasa' = metal incandescente (abertura, quando o raio atinge o emblema) */
  variante?: 'aco' | 'brasa'
}

export function emblemaSvg(p: Paleta, o: EmblemaOpts = {}) {
  const i = o.id ?? 'em'
  const br = o.variante === 'brasa'
  // cores: aço escovado ou metal em brasa (amarelo-branco no centro, laranja e vermelho escuro nas bordas)
  const A = br ? ['#FFF3C4', '#FFB547', '#B8360B', '#FF8A3D', '#6E1505'] : ['#E4EAF1', '#8E99A9', '#3B4350', '#A3AEBD', '#454D5A']
  const B = br ? ['#7A1C08', '#2A0703'] : ['#2C333E', '#0E1218']
  const C = br ? ['#FFFBEA', '#FFD27A', '#FF8A2A', '#FFE6A8'] : ['#F6F8FB', '#AEB8C5', '#6B7584', '#D9E0E8']
  const D = br ? ['#FFFFFF', '#FFE7A6', '#FF8A2A'] : ['#EAF5FF', p.eletrico, '#2E62F0']
  const brilhoRaio = br ? '#FFB547' : p.eletrico
  const a11y = o.title ? `role="img" aria-label="${o.title}"` : 'aria-hidden="true" focusable="false"'
  // linhas de metal escovado (bem sutis)
  let escovado = ''
  for (let y = 18; y < 100; y += 3.2) escovado += `M10 ${y.toFixed(1)} H90 `
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 112" ${a11y} ${o.attrs ?? ''}>` +
    `<defs>` +
    `<linearGradient id="${i}a" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stop-color="${A[0]}"/><stop offset=".36" stop-color="${A[1]}"/><stop offset=".5" stop-color="${A[2]}"/><stop offset=".68" stop-color="${A[3]}"/><stop offset="1" stop-color="${A[4]}"/></linearGradient>` +
    `<linearGradient id="${i}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${B[0]}"/><stop offset="1" stop-color="${B[1]}"/></linearGradient>` +
    `<linearGradient id="${i}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C[0]}"/><stop offset=".5" stop-color="${C[1]}"/><stop offset=".56" stop-color="${C[2]}"/><stop offset="1" stop-color="${C[3]}"/></linearGradient>` +
    `<linearGradient id="${i}d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${D[0]}"/><stop offset=".45" stop-color="${D[1]}"/><stop offset="1" stop-color="${D[2]}"/></linearGradient>` +
    `<linearGradient id="${i}e" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset=".4" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
    `<clipPath id="${i}f"><path d="${ESCUDO_INTERNO}"/></clipPath>` +
    `</defs>` +
    // escudo de aço com chanfro
    (br ? `<path d="${ESCUDO}" fill="none" stroke="#FF7A1A" stroke-opacity=".35" stroke-width="9" stroke-linejoin="round"/>` : '') +
    `<path d="${ESCUDO}" fill="url(#${i}a)" stroke="${br ? '#5A1204' : '#151A21'}" stroke-width="2"/>` +
    `<path d="${ESCUDO}" fill="none" stroke="url(#${i}e)" stroke-width="2.2" transform="translate(50 56) scale(.955) translate(-50 -56)"/>` +
    `<path d="${ESCUDO_INTERNO}" fill="url(#${i}b)" stroke="#000" stroke-opacity=".5" stroke-width="1.4"/>` +
    `<path d="${escovado}" stroke="#fff" stroke-opacity=".05" stroke-width=".8" clip-path="url(#${i}f)"/>` +
    // raio incrustado (energia) com brilho
    `<path d="${RAIO}" fill="none" stroke="${brilhoRaio}" stroke-opacity=".28" stroke-width="7" stroke-linejoin="round" clip-path="url(#${i}f)"/>` +
    `<path d="${RAIO}" fill="url(#${i}d)" stroke="#BFE0FF" stroke-width=".8" stroke-linejoin="round" clip-path="url(#${i}f)"/>` +
    // letras em relevo (sombra + aço claro)
    `<g transform="translate(1.2 1.6)" fill="#05070A" opacity=".75"><path d="${J}"/><path d="${L}"/></g>` +
    `<g fill="url(#${i}c)" stroke="#1B2029" stroke-width="1.4" stroke-linejoin="round"><path d="${J}"/><path d="${L}"/></g>` +
    `<path d="M30 36.2 H48 M54 36.2 H63" stroke="#fff" stroke-opacity=".8" stroke-width=".9"/>` +
    `</svg>`
  )
}

export const emblemaDataUri = (p: Paleta) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(emblemaSvg(p))}`
