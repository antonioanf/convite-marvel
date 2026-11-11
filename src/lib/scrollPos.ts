/**
 * Posição do scroll lida UMA vez por evento de scroll (o navegador dispara antes dos quadros).
 * Quem precisa dela a cada quadro (brilho holográfico, barra de progresso) usa este valor,
 * em vez de ler window.scrollY no meio de um quadro — o que força o navegador a recalcular
 * estilos e layout quando algo já mudou naquele quadro.
 */
export const scrollPos = { y: typeof window !== 'undefined' ? window.scrollY : 0 }

const listeners = new Set<() => void>()

if (typeof window !== 'undefined') {
  window.addEventListener(
    'scroll',
    () => {
      scrollPos.y = window.scrollY
      listeners.forEach((l) => l())
    },
    { passive: true },
  )
}

export function onScrollPos(l: () => void) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}
