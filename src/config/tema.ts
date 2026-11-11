/**
 * Transforma a paleta do config em variáveis CSS.
 * Fundo escuro: o texto é branco quente (≈18:1) e o secundário (branco-2) fica ≈9:1.
 * As cores de destaque que são escuras demais para texto pequeno (vermelho ≈4,4:1, roxo ≈3,4:1)
 * ganham um tom "-txt" clareado (≥ 6:1) — use `text-vermelho-txt`, `text-roxo-txt` etc. em texto.
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

/** "r g b" para usar em rgb(var(--x-rgb) / .5) */
const rgb = (h: string) => toRgb(h).join(' ')

export function temaVars(p: Paleta): Record<string, string> {
  const v: Record<string, string> = {
    '--color-branco-2': mix(p.branco, p.fundo2, 0.72),
    // tons de texto clareados (contraste AA sobre o fundo e os cartões)
    '--color-vermelho-txt': mix(p.vermelho, '#FFFFFF', 0.72),
    '--color-roxo-txt': mix(p.roxo, '#FFFFFF', 0.58),
    '--color-violeta-txt': mix(p.violeta, '#FFFFFF', 0.7),
    '--color-azul-txt': mix(p.azul, '#FFFFFF', 0.82),
  }
  for (const [k, cor] of Object.entries(p)) {
    v[`--color-${k}`] = cor
    v[`--${k}-rgb`] = rgb(cor)
  }
  return v
}

export const temaCss = (p: Paleta) =>
  ':root{' + Object.entries(temaVars(p)).map(([k, v]) => `${k}:${v}`).join(';') + '}'
