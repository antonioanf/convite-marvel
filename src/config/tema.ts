/**
 * Transforma a paleta do config em variáveis CSS.
 * Fundo escuro: o texto é branco frio (≈17:1), o secundário (branco-2) fica ≈9:1 e os acentos
 * (elétrico, ciano, fogo, dourado) passam de 7:1 sobre o fundo — tudo AA.
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
    '--color-branco-2': mix(p.branco, p.fundo2, 0.7),
  }
  for (const [k, cor] of Object.entries(p)) {
    v[`--color-${k}`] = cor
    v[`--${k}-rgb`] = rgb(cor)
  }
  return v
}

export const temaCss = (p: Paleta) =>
  ':root{' + Object.entries(temaVars(p)).map(([k, v]) => `${k}:${v}`).join(';') + '}'
