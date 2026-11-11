/**
 * Transforma a paleta do config em variáveis CSS.
 * Também calcula os tons de TEXTO derivados, escolhidos para passar no contraste AA (≥ 4,5:1)
 * sobre o céu e sobre os quadros brancos:
 *  - tinta-2 (texto secundário): marinho com um pouco de azul  → ~9,5:1 no céu
 *  - vermelho-txt (texto pequeno vermelho): vermelho escurecido → ~5:1 no céu
 * O vermelho puro só leva texto branco (5:1) ou aparece em títulos grandes.
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
    '--color-vermelho': p.vermelho,
    '--color-azul': p.azul,
    '--color-marinho': p.marinho,
    '--color-amarelo': p.amarelo,
    '--color-ceu': p.ceu,
    '--color-branco': p.branco,
    '--color-ciano': p.ciano,
    '--color-turquesa': p.turquesa,
    '--color-mostarda': p.mostarda,
    '--color-fogo': p.fogo,
    '--color-lilas': p.lilas,
    '--color-dourado': p.dourado,
    // tons de texto (contraste AA garantido sobre céu/branco)
    '--color-tinta-2': mix(p.marinho, p.azul, 0.7),
    '--color-vermelho-txt': mix(p.vermelho, p.marinho, 0.7),
    // tons de apoio (fundos e sombras, nunca texto)
    '--color-vermelho-esc': mix(p.vermelho, p.marinho, 0.72),
    '--color-azul-esc': mix(p.azul, p.marinho, 0.6),
    '--color-ceu-claro': mix(p.ceu, p.branco, 0.45),
    '--color-amarelo-esc': mix(p.amarelo, p.vermelho, 0.55),
  }
}

export const temaCss = (p: Paleta) =>
  ':root{' + Object.entries(temaVars(p)).map(([k, v]) => `${k}:${v}`).join(';') + '}'
