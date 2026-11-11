import type { ComponentProps, PointerEvent, ReactNode } from 'react'
import { usePress } from '../../hooks/usePress'

type Variant = 'primary' | 'soft'

function cls(variant: Variant, pressed: boolean, extra?: string) {
  return ['btn', `btn-${variant}`, pressed && 'is-pressed', extra].filter(Boolean).join(' ')
}

/** Brilho que segue o dedo dentro do botão (spotlight). */
function moveSpot(e: PointerEvent<HTMLElement>) {
  const el = e.currentTarget
  const spot = el.querySelector<HTMLElement>(':scope > .spot')
  if (!spot) return
  const r = el.getBoundingClientRect()
  spot.style.transform = `translate(${e.clientX - r.left}px, ${e.clientY - r.top}px)` // 2D: não cria camada
}

function useButton() {
  const { pressed, handlers } = usePress()
  return {
    pressed,
    handlers: {
      ...handlers,
      onPointerDown: (e: PointerEvent<HTMLElement>) => {
        moveSpot(e)
        e.currentTarget.classList.add('is-touched')
        handlers.onPointerDown()
      },
      onPointerMove: moveSpot,
      onPointerUp: (e: PointerEvent<HTMLElement>) => {
        const el = e.currentTarget
        setTimeout(() => el.classList.remove('is-touched'), 300)
        handlers.onPointerUp()
      },
      onPointerLeave: (e: PointerEvent<HTMLElement>) => {
        e.currentTarget.classList.remove('is-touched')
        handlers.onPointerLeave()
      },
    },
  }
}

export function PressButton({
  variant = 'primary',
  className,
  children,
  ...rest
}: ComponentProps<'button'> & { variant?: Variant; children: ReactNode }) {
  const { pressed, handlers } = useButton()
  return (
    <button type="button" {...rest} {...handlers} className={cls(variant, pressed, className)}>
      <span className="spot" aria-hidden="true" />
      {children}
    </button>
  )
}

export function PressLink({
  variant = 'primary',
  className,
  children,
  ...rest
}: ComponentProps<'a'> & { variant?: Variant; children: ReactNode }) {
  const { pressed, handlers } = useButton()
  return (
    <a {...rest} {...handlers} className={cls(variant, pressed, className)}>
      <span className="spot" aria-hidden="true" />
      {children}
    </a>
  )
}
