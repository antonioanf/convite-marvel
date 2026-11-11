import type { HTMLAttributes } from 'react'

/**
 * Cartão: vidro escuro com borda de luz na cor de destaque (`acc`: vermelho, azul, dourado, roxo...).
 * Sem `acc`, herda a cor da seção.
 */
export function Card({ acc, className = '', children, ...rest }: HTMLAttributes<HTMLDivElement> & { acc?: string }) {
  return (
    <div {...rest} className={`cartao ${acc ?? ''} ${className}`}>
      {children}
    </div>
  )
}
