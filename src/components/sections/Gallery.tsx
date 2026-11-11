import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { motion } from 'framer-motion'
import { convite, type Foto } from '../../config/convite'
import { Photo } from '../ui/Photo'
import { SectionTitle } from '../ui/SectionTitle'
import { Lightbox } from './Lightbox'
import { vibrate } from '../../lib/haptics'
import { indice } from '../../lib/secoes'
import { perf } from '../../lib/perf'

const fotos: Foto[] = convite.galeria.length ? convite.galeria : [{ alt: 'Foto do ensaio' }, { alt: 'Foto do ensaio' }, { alt: 'Foto do ensaio' }]
const ratio = (f: Foto) => (f.largura && f.altura ? f.largura / f.altura : 0.8)

/** Foto do carrossel: máscara abrindo ao entrar + leve inclinação 3D enquanto o dedo segura. */
function Slide({ index, onOpen }: { index: number; onOpen: (i: number, el: HTMLElement) => void }) {
  const ref = useRef<HTMLButtonElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const holding = useRef(false)
  const f = fotos[index]
  // verticais: largura pelo formato (até 3:5); horizontais: o que couber na tela, sem passar do formato original
  const r = ratio(f)
  const style = { '--r': Math.max(0.6, r) } as CSSProperties

  const tilt = (e: PointerEvent) => {
    const el = ref.current
    if (!el || !inner.current || !holding.current) return
    const b = el.getBoundingClientRect()
    const px = (e.clientX - b.left) / b.width - 0.5
    const py = (e.clientY - b.top) / b.height - 0.5
    inner.current.style.transform = `perspective(800px) rotateY(${px * 10}deg) rotateX(${-py * 10}deg) scale(.98)`
  }
  const release = () => {
    holding.current = false
    if (inner.current) inner.current.style.transform = ''
  }

  return (
    <button
      ref={ref}
      type="button"
      aria-label={`Abrir foto ${index + 1}: ${f.alt}`}
      onPointerDown={(e) => {
        holding.current = true
        tilt(e)
      }}
      onPointerMove={tilt}
      onPointerUp={release}
      onPointerCancel={release}
      onPointerLeave={release}
      onClick={() => {
        vibrate(8)
        if (ref.current) onOpen(index, ref.current)
      }}
      className="slide relative block text-left"
      style={style}
    >
      <div ref={inner} className="absolute inset-0 transition-transform duration-300 ease-out">
        <motion.div
          initial={perf.reducedMotion ? false : { clipPath: 'inset(12% 12% 12% 12% round 26px)', scale: 1.06 }}
          whileInView={{ clipPath: 'inset(0% 0% 0% 0% round 26px)', scale: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1] }}
          className="absolute inset-0 overflow-hidden rounded-[26px] shadow-[0_24px_44px_-24px_rgba(139,92,246,.75)]"
        >
          <Photo foto={f} small sizes="(max-width: 480px) 86vw, 420px" />
        </motion.div>
      </div>
    </button>
  )
}

export function Gallery() {
  const track = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState<number | null>(null)
  const opener = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const el = track.current
    if (!el) return
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        // ativa a foto cujo centro está mais perto do centro do carrossel
        const mid = el.scrollLeft + el.clientWidth / 2
        let best = 0
        let bestD = Infinity
        Array.from(el.children).forEach((c, i) => {
          const h = c as HTMLElement
          const d = Math.abs(h.offsetLeft + h.offsetWidth / 2 - mid)
          if (d < bestD) {
            bestD = d
            best = i
          }
        })
        setActive(best)
      })
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  const goTo = (i: number) => {
    const el = track.current
    const child = el?.children[i] as HTMLElement | undefined
    if (el && child) el.scrollTo({ left: child.offsetLeft - (el.clientWidth - child.offsetWidth) / 2, behavior: 'smooth' })
  }

  const onOpen = useCallback((i: number, el: HTMLElement) => {
    opener.current = el
    setOpen(i)
  }, [])

  return (
    <section id="galeria" aria-labelledby="t-galeria" className="pb-14">
      <div className="wrap">
        <SectionTitle id="t-galeria" index={indice('galeria')} kicker="Ensaio de fotos" title="Momentos" />
      </div>
      <div ref={track} className="carousel reveal" role="list" data-no-spawn>
        {fotos.map((_, i) => (
          <div role="listitem" key={i}>
            <Slide index={i} onOpen={onOpen} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-center" role="group" aria-label="Escolher foto">
        {fotos.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Ir para a foto ${i + 1}`}
            aria-current={i === active}
            className="grid h-12 w-7 place-items-center"
          >
            <span className={`pill-dot ${i === active ? 'is-on' : ''}`} />
          </button>
        ))}
      </div>
      <p className="label mt-1 text-center">Deslize · toque para ampliar</p>
      <Lightbox
        fotos={fotos}
        index={open}
        onClose={() => {
          setOpen(null)
          opener.current?.focus({ preventScroll: true })
        }}
      />
    </section>
  )
}
