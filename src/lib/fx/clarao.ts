/**
 * Segurança dos clarões: no máximo 3 por segundo no convite inteiro.
 * Os clarões nunca são branco puro em tela cheia (azul-claro ou dourado, opacidade ≤ 0,6) — quem
 * desenha usa CLARAO_MAX. Com prefers-reduced-motion não há clarão nenhum.
 */
import { prefersReducedMotion } from '../perf'

export const CLARAO_MAX = 0.55
const recentes: number[] = []

/** Pede licença para um clarão agora. `false` = já houve 3 no último segundo (ou movimento reduzido). */
export function podeClarear(agora = performance.now()) {
  if (prefersReducedMotion()) return false
  while (recentes.length && agora - recentes[0] > 1000) recentes.shift()
  if (recentes.length >= 3) return false
  recentes.push(agora)
  return true
}
