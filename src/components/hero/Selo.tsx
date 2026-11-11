import { useMemo } from 'react'
import { convite } from '../../config/convite'
import { emblemaSvg, ESCUDO } from '../../lib/emblema'

const mascara = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 112'><path d='${ESCUDO}'/></svg>`)}")`

/** Emblema JL como selo de metal: aura de energia atrás e um reflexo de luz que atravessa o metal. */
export function Selo({ className = '' }: { className?: string }) {
  const svg = useMemo(() => emblemaSvg(convite.paleta, { id: 'selo', attrs: 'width="100%"' }), [])
  return (
    <div className={`selo ${className}`} aria-hidden="true">
      <div className="selo-aura" />
      <div dangerouslySetInnerHTML={{ __html: svg }} style={{ position: 'relative' }} />
      <div className="selo-reflexo" style={{ ['--escudo' as string]: mascara }} />
    </div>
  )
}
