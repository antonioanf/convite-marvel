/**
 * Brilho holográfico: o ângulo do gradiente (--holo-a) muda com a inclinação do celular e com o scroll.
 * Só os elementos registrados (data-holo) E visíveis na tela recebem a variável: cada escrita faz o
 * navegador recalcular o estilo daquele cartão, então os que estão fora da tela ficam parados.
 * Chamado a cada frame pelo EffectsLayer; só escreve quando o ângulo muda de verdade.
 */
import { useEffect, type RefObject } from 'react'
import { tilt } from './tilt'
import { scrollPos } from './scrollPos'

const els = new Set<HTMLElement>()
const visible = new Set<HTMLElement>()
let last = Infinity
let io: IntersectionObserver | null = null

function observer() {
  io ??= new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        const el = e.target as HTMLElement
        if (e.isIntersecting) {
          visible.add(el)
          last = Infinity // atualiza na hora quem acabou de aparecer
        } else visible.delete(el)
      }),
    { rootMargin: '80px 0px' },
  )
  return io
}

export function updateHolo() {
  if (!visible.size) return
  // scrollPos.y em vez de window.scrollY: ler o scroll aqui forçava estilo + layout a cada quadro
  const a = tilt.x * 55 + tilt.y * 30 + scrollPos.y * 0.09
  if (Math.abs(a - last) < 0.8) return
  last = a
  const v = `${a.toFixed(1)}deg`
  visible.forEach((el) => el.style.setProperty('--holo-a', v))
}

export function useHolo(ref: RefObject<HTMLElement | null>, on = true) {
  useEffect(() => {
    const el = ref.current
    if (!el || !on) return
    els.add(el)
    observer().observe(el)
    last = Infinity
    return () => {
      els.delete(el)
      visible.delete(el)
      io?.unobserve(el)
    }
  }, [ref, on])
}
