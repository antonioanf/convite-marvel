import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion'
import type { Foto } from '../../config/convite'
import { Photo } from '../ui/Photo'
import { scroll } from '../../lib/scroll'
import { butterflyBurst } from '../../lib/butterflySvg'
import { vibrate } from '../../lib/haptics'
import { Icon } from '../ui/Icons'

/**
 * Lightbox em tela cheia:
 *  - deslizar para o lado troca de foto (scroll-snap nativo)
 *  - puxar para baixo fecha (arrasto do Framer Motion no eixo Y)
 *  - borboletas saem da foto ao abrir
 */
export function Lightbox({ fotos, index, onClose }: { fotos: Foto[]; index: number | null; onClose: () => void }) {
  return createPortal(
    <AnimatePresence>{index !== null && <Viewer fotos={fotos} start={index} onClose={onClose} />}</AnimatePresence>,
    document.body,
  )
}

function Viewer({ fotos, start, onClose }: { fotos: Foto[]; start: number; onClose: () => void }) {
  const track = useRef<HTMLDivElement>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)
  const [cur, setCur] = useState(start)
  const y = useMotionValue(0)
  const bgOpacity = useTransform(y, [0, 300], [1, 0.2])
  const imgScale = useTransform(y, [0, 300], [1, 0.85])

  useLayoutEffect(() => {
    const el = track.current
    if (el) el.scrollLeft = start * el.clientWidth
  }, [start])

  useEffect(() => {
    scroll.lock(true)
    closeBtn.current?.focus({ preventScroll: true })
    const t = setTimeout(() => butterflyBurst({ x: innerWidth / 2, y: innerHeight / 2, count: 7 }), 250)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(t)
      window.removeEventListener('keydown', onKey)
      scroll.lock(false)
    }
  }, [])

  const go = (d: number) => {
    const el = track.current
    if (!el) return
    el.scrollTo({ left: el.scrollLeft + d * el.clientWidth, behavior: 'smooth' })
  }

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Fotos do ensaio"
      className="fixed inset-0 z-[90] h-[100dvh]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div className="absolute inset-0 bg-[#1e0c3c]/95" style={{ opacity: bgOpacity }} />
      <motion.div
        className="absolute inset-0"
        drag="y"
        dragDirectionLock
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.1, bottom: 0.8 }}
        style={{ y, scale: imgScale }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 110 || info.velocity.y > 600) {
            vibrate(10)
            onClose()
          }
        }}
        initial={{ scale: 0.88 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      >
        <div
          ref={track}
          onScroll={(e) => {
            const el = e.currentTarget
            setCur(Math.round(el.scrollLeft / el.clientWidth))
          }}
          className="flex h-full w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {fotos.map((f, i) => (
            <div key={i} className="relative flex h-full w-full shrink-0 snap-center items-center justify-center px-3 py-20">
              {/* foto inteira, no formato original (sem recorte) */}
              <div
                className="relative max-w-[460px] overflow-hidden rounded-[24px] shadow-[0_30px_80px_-24px_rgba(139,92,246,.8)]"
                style={{ aspectRatio: `${f.largura ?? 4} / ${f.altura ?? 5}`, width: `min(100%, calc((100dvh - 160px) * ${(f.largura ?? 4) / (f.altura ?? 5)}))` }}
              >
                <Photo foto={f} sizes="100vw" eager={Math.abs(i - start) <= 1} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-[max(14px,env(safe-area-inset-top))]">
        <span className="mono rounded-full bg-white/15 px-4 py-2 text-[15px] text-white" aria-live="polite">
          {cur + 1} / {fotos.length}
        </span>
        <button
          ref={closeBtn}
          type="button"
          onClick={onClose}
          aria-label="Fechar fotos"
          className="pointer-events-auto grid h-12 w-12 place-items-center rounded-full bg-white/90 text-roxo shadow-lg transition-transform active:scale-90"
        >
          <Icon name="fechar" size={22} />
        </button>
      </div>
      <p className="mono pointer-events-none absolute inset-x-0 bottom-0 px-6 pb-[max(20px,env(safe-area-inset-bottom))] text-center text-[11px] uppercase tracking-[0.2em] text-white/75">
        puxe para baixo para fechar
      </p>
    </motion.div>
  )
}
