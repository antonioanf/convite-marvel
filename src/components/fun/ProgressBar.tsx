import { useEffect, useRef } from 'react'
import { useOpened } from '../../hooks/useStores'
import { onScrollPos, scrollPos } from '../../lib/scrollPos'

/** Barra fina e iridescente no topo: quanto do convite já foi visto (só transform). */
export function ProgressBar() {
  const ref = useRef<HTMLDivElement>(null)
  const opened = useOpened()
  useEffect(() => {
    if (!opened) return
    // a altura da página só é medida quando ela muda (ResizeObserver/resize), nunca a cada scroll
    let max = 1
    const measure = () => {
      max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
      update()
    }
    const update = () => {
      const k = Math.min(1, Math.max(0, scrollPos.y / max))
      if (ref.current) ref.current.style.transform = `scaleX(${k.toFixed(4)})`
    }
    const ro = new ResizeObserver(measure)
    ro.observe(document.body)
    window.addEventListener('resize', measure, { passive: true })
    const off = onScrollPos(update)
    measure()
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
      off()
    }
  }, [opened])
  return <div ref={ref} className="progress" aria-hidden="true" />
}
