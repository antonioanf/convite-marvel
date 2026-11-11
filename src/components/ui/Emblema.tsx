import { convite } from '../../config/convite'
import { emblemaSvg } from '../../lib/emblema'

/** Emblema "JL" (escudo + raio). Decorativo por padrão; passe `title` para ser lido. */
export function Emblema({ size = 64, glow = false, title, className = '' }: { size?: number; glow?: boolean; title?: string; className?: string }) {
  const svg = emblemaSvg(convite.paleta, { glow, title, attrs: `width="100%" height="100%"` })
  return (
    <span
      className={`emblema inline-block ${className}`}
      style={{ width: size, height: size * (glow ? 132 / 124 : 1.12) }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
