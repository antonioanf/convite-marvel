import { useEffect, useRef, type ReactNode } from 'react'
import type { Foto } from '../../config/convite'
import { Photo } from './Photo'
import { tilt } from '../../lib/tilt'
import { perf } from '../../lib/perf'

const MAX_DEG = 8 // inclinação máxima: pequena, para não distorcer o rosto

/**
 * Foto estilo "cartão holográfico": inclina em 3D com o giroscópio (ou com o dedo/mouse)
 * e um reflexo iridescente desliza por cima. Só transform/opacity, e só enquanto está na tela.
 */
export function HoloPhoto({
  foto,
  eager,
  sizes,
  className = '',
  perch,
  imgRef,
  children,
}: {
  foto: Foto
  eager?: boolean
  sizes?: string
  className?: string
  /** pontos de pouso das borboletas (data-perch) */
  perch?: string
  /** recebe o <div> da imagem (para o parallax) */
  imgRef?: React.RefObject<HTMLDivElement | null>
  children?: ReactNode
}) {
  const wrap = useRef<HTMLDivElement>(null)
  const card = useRef<HTMLDivElement>(null)
  const sheen = useRef<HTMLDivElement>(null)
  const ptr = useRef({ on: false, x: 0, y: 0 })

  useEffect(() => {
    const el = wrap.current
    if (!el || perf.reducedMotion) return
    let raf = 0
    let visible = true
    let cx = 0
    let cy = 0
    let lastT = ''
    const loop = () => {
      raf = 0
      if (!visible || document.hidden) return
      const p = ptr.current
      const tx = p.on ? p.x : tilt.x
      const ty = p.on ? p.y : tilt.y
      cx += (tx - cx) * 0.12
      cy += (ty - cy) * 0.12
      const t = `perspective(1000px) rotateY(${(cx * MAX_DEG).toFixed(2)}deg) rotateX(${(-cy * MAX_DEG).toFixed(2)}deg)`
      if (t !== lastT && card.current && sheen.current) {
        lastT = t
        card.current.style.transform = t
        sheen.current.style.transform = `translate3d(${(-cx * 28).toFixed(1)}%, ${(-cy * 18).toFixed(1)}%, 0)`
        sheen.current.style.opacity = String(0.45 + Math.min(0.45, Math.hypot(cx, cy) * 0.7))
      }
      raf = requestAnimationFrame(loop)
    }
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible && !raf) raf = requestAnimationFrame(loop)
    })
    io.observe(el)
    const onVis = () => !document.hidden && visible && !raf && (raf = requestAnimationFrame(loop))
    document.addEventListener('visibilitychange', onVis)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  const onMove = (e: React.PointerEvent) => {
    const r = wrap.current?.getBoundingClientRect()
    if (!r) return
    ptr.current = {
      on: true,
      x: Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2)),
      y: Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2)),
    }
  }
  const off = () => (ptr.current.on = false)

  return (
    <div
      ref={wrap}
      className={`relative ${className}`}
      onPointerMove={onMove}
      onPointerDown={onMove}
      onPointerLeave={off}
      onPointerUp={(e) => e.pointerType !== 'mouse' && off()}
      onPointerCancel={off}
    >
      <div ref={card} className="holo-card absolute inset-0" data-perch={perch}>
        <div className="absolute inset-0 overflow-hidden rounded-[inherit]">
          <div ref={imgRef} className="absolute inset-[-6%_0] will-change-transform">
            <Photo foto={foto} eager={eager} sizes={sizes} />
          </div>
          <div ref={sheen} className="holo-sheen" aria-hidden="true" />
          {children}
        </div>
      </div>
    </div>
  )
}
