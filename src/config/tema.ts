/**
 * Transforma a paleta do config em variáveis CSS.
 * Também calcula os tons de TEXTO derivados (misturas com o roxo profundo), escolhidos
 * para passar no contraste AA (≥ 4,5:1) sobre o fundo perolado e sobre cartões brancos.
 * Usado pelo vite.config.ts (injeta no index.html), pela moldura do desktop e pela imagem OG.
 */
import type { Paleta } from './convite.ts'

const toRgb = (h: string) => {
  const n = parseInt(h.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const toHex = (c: number[]) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')

/** Mistura `a` e `b` (k = peso de `a`, de 0 a 1). */
export function mix(a: string, b: string, k: number) {
  const A = toRgb(a)
  const B = toRgb(b)
  return toHex(A.map((v, i) => v * k + B[i] * (1 - k)))
}

export function temaVars(p: Paleta): Record<string, string> {
  return {
    '--color-perola': p.perola,
    '--color-lavanda': p.lavanda,
    '--color-lilas': p.lilas,
    '--color-violeta': p.violeta,
    '--color-roxo': p.roxo,
    '--color-rosa': p.rosa,
    '--color-magenta': p.magenta,
    '--color-prata': p.prata,
    '--color-holo-ciano': p.holoCiano,
    '--color-holo-rosa': p.holoRosa,
    // tons de texto (contraste AA garantido sobre perolado/branco)
    '--color-tinta-2': mix(p.roxo, p.perola, 0.78),
    '--color-violeta-txt': mix(p.violeta, p.roxo, 0.6),
    '--color-magenta-txt': mix(p.magenta, p.roxo, 0.6),
    // gradiente dos botões principais (texto branco AA)
    '--color-btn-a': mix(p.violeta, p.roxo, 0.82),
    '--color-btn-b': mix(p.magenta, p.roxo, 0.86),
  }
}

export const temaCss = (p: Paleta) =>
  ':root{' + Object.entries(temaVars(p)).map(([k, v]) => `${k}:${v}`).join(';') + '}'
