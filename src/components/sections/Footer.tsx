import { useEffect, useRef } from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import { convite } from '../../config/convite'
import { ButterflyIcon } from '../ui/ButterflyIcon'
import { perf } from '../../lib/perf'
import { dataCurta } from '../../lib/datas'

export function Footer() {
  const end = useRef<HTMLDivElement>(null)
  const fly = useAnimationControls()
  const flown = useRef(false)

  // borboleta final: quando a pessoa chega ao fim, ela voa para fora da tela
  useEffect(() => {
    const el = end.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || flown.current) return
        flown.current = true
        io.disconnect()
        if (perf.reducedMotion) return
        setTimeout(() => {
          fly.start({
            x: [0, 30, -24, 70, 220],
            y: [0, -50, -130, -230, -480],
            rotate: [0, 16, -12, 22, 28],
            scale: [1, 1.15, 1.05, 1.2, 0.9],
            opacity: [1, 1, 1, 1, 0],
            transition: { duration: 3.2, ease: 'easeInOut' },
          })
        }, 900)
      },
      { threshold: 0.9 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [fly])

  return (
    <footer className="wrap pb-10 pt-4 text-center">
      <div ref={end} className="relative mx-auto flex flex-col items-center">
        <motion.div animate={fly} className="mb-2" aria-hidden="true">
          <ButterflyIcon size={44} speed={0.45} />
        </motion.div>
        {convite.assinatura && <p className="serif text-[38px] leading-tight text-roxo">{convite.assinatura}</p>}
        <p className={`${convite.assinatura ? 'mt-1 text-[16px] font-medium text-tinta-2' : 'serif text-[40px] leading-tight text-roxo'}`}>Esperamos você!</p>
        <p className="label mt-3">
          {convite.crianca.nome} · {dataCurta}
        </p>
      </div>
    </footer>
  )
}
