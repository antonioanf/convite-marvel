import { memo, useMemo } from 'react'
import { convite } from '../../config/convite'
import { heroiSvg, type HeroiId, type Pose } from '../../lib/herois'

/** Um herói da equipe (SVG gerado por lib/herois). Decorativo por padrão; passe `title` para ser lido. */
export const Heroi = memo(function Heroi({ id, pose = 'normal', title, className = '', pisca = 0 }: { id: HeroiId; pose?: Pose; title?: string; className?: string; pisca?: number }) {
  const svg = useMemo(() => heroiSvg(id, pose, convite.paleta, { title, attrs: `width="100%" height="100%" style="--pisca:${pisca}s"` }), [id, pose, title, pisca])
  return <span className={`block ${className}`} dangerouslySetInnerHTML={{ __html: svg }} />
})
