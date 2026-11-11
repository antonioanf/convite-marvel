import type { ComponentProps, ReactNode } from 'react'
import { usePress } from '../../hooks/usePress'

type Variant = 'primary' | 'soft'

function cls(variant: Variant, pressed: boolean, extra?: string) {
  return ['btn', `btn-${variant}`, pressed && 'is-pressed', extra].filter(Boolean).join(' ')
}

/** Botão com efeito de pressão e vibração curta (usePress). */
export function PressButton({ variant = 'primary', className, children, ...rest }: ComponentProps<'button'> & { variant?: Variant; children: ReactNode }) {
  const { pressed, handlers } = usePress()
  return (
    <button type="button" {...rest} {...handlers} className={cls(variant, pressed, className)}>
      {children}
    </button>
  )
}

export function PressLink({ variant = 'primary', className, children, ...rest }: ComponentProps<'a'> & { variant?: Variant; children: ReactNode }) {
  const { pressed, handlers } = usePress()
  return (
    <a {...rest} {...handlers} className={cls(variant, pressed, className)}>
      {children}
    </a>
  )
}
