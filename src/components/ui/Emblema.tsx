import { useMemo } from 'react'
import { convite } from '../../config/convite'
import { emblemaSvg } from '../../lib/emblema'

/** Emblema "JL" (escudo de metal + raio). Decorativo por padrão; passe `title` para ser lido. */
export function Emblema({ size = 64, title, id = 'emb', className = '' }: { size?: number; title?: string; id?: string; className?: string }) {
  const svg = useMemo(() => emblemaSvg(convite.paleta, { title, id, attrs: `width="100%" height="100%"` }), [title, id])
  return <span className={`inline-block ${className}`} style={{ width: size, height: size * 1.12 }} dangerouslySetInnerHTML={{ __html: svg }} />
}
